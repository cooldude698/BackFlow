// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ISettlementEngine.sol";
import "./interfaces/IAgreementManager.sol";

contract SettlementEngine is ISettlementEngine, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant BPS_DIVISOR = 10000;

    IAgreementManager public agreementManager;

    constructor(address _agreementManager) Ownable(msg.sender) {
        require(_agreementManager != address(0), "Invalid AgreementManager");
        agreementManager = IAgreementManager(_agreementManager);
    }

    function setAgreementManager(address _agreementManager) external onlyOwner {
        require(_agreementManager != address(0), "Invalid AgreementManager");
        agreementManager = IAgreementManager(_agreementManager);
    }

    /**
     * @notice Settles a client/payer payment for an agreement.
     * Calculates pro-rata revenue shares, clamps to remaining caps, distributes to backers,
     * and sends the entire net remainder to the earner.
     * @param agreementId The BackFlow agreement ID
     * @param grossAmount Gross payment in atomic token units (e.g., 1000 * 10^6 for USDC)
     * @param payer The payer address (if address(0), defaults to msg.sender)
     */
    function settlePayment(
        uint256 agreementId,
        uint256 grossAmount,
        address payer
    ) external nonReentrant returns (uint256 earnerPayout, uint256 totalBackerPayout) {
        require(grossAmount > 0, "Gross amount must be > 0");
        address actualPayer = payer == address(0) ? msg.sender : payer;

        IAgreementManager.Agreement memory ag = agreementManager.getAgreement(agreementId);
        require(ag.id != 0, "Agreement not found");
        require(ag.status == IAgreementManager.AgreementStatus.ACTIVE, "Agreement is not ACTIVE");

        // Verify duration expiry
        if (ag.startTime > 0 && block.timestamp > ag.startTime + ag.duration) {
            revert("Agreement duration expired");
        }

        // Pull gross payment from payer into this settlement router
        IERC20(ag.paymentToken).safeTransferFrom(actualPayer, address(this), grossAmount);

        // Calculate raw backer pool revenue cut
        uint256 rawBackerCut = (grossAmount * ag.revenueShareBps) / BPS_DIVISOR;

        // Distribute to backers
        totalBackerPayout = _distributeToBackers(
            agreementId,
            rawBackerCut,
            ag.totalFunded,
            ag.paymentToken
        );

        // Remainder flows to Earner (guarantees zero trapped funds)
        earnerPayout = grossAmount - totalBackerPayout;
        IERC20(ag.paymentToken).safeTransfer(ag.earner, earnerPayout);

        emit PaymentSettled(agreementId, actualPayer, grossAmount, totalBackerPayout, earnerPayout);

        // Check if all caps reached
        if (agreementManager.areAllBackersCompleted(agreementId)) {
            agreementManager.markAgreementCompleted(agreementId);
        }

        return (earnerPayout, totalBackerPayout);
    }

    function _distributeToBackers(
        uint256 agreementId,
        uint256 rawBackerCut,
        uint256 totalFunded,
        address paymentToken
    ) internal returns (uint256 totalBackerPayout) {
        if (rawBackerCut == 0) return 0;

        address[] memory backers = agreementManager.getBackers(agreementId);
        uint256 length = backers.length;

        for (uint256 i = 0; i < length; i++) {
            totalBackerPayout += _processSingleBacker(
                agreementId,
                backers[i],
                rawBackerCut,
                totalFunded,
                paymentToken
            );
        }
    }

    function _processSingleBacker(
        uint256 agreementId,
        address backerAddr,
        uint256 rawBackerCut,
        uint256 totalFunded,
        address paymentToken
    ) internal returns (uint256 payout) {
        IAgreementManager.BackerPosition memory pos = agreementManager.getBackerPosition(agreementId, backerAddr);

        if (pos.isCompleted || pos.distributedAmount >= pos.maxCap) {
            return 0;
        }

        uint256 theoretical = (rawBackerCut * pos.fundedAmount) / totalFunded;
        uint256 remainingCap = pos.maxCap - pos.distributedAmount;
        payout = theoretical < remainingCap ? theoretical : remainingCap;

        if (payout > 0) {
            // Update on-chain accounting first (CEI)
            agreementManager.recordSettlementDistribution(agreementId, backerAddr, payout);

            // Execute immediate token transfer to backer
            IERC20(paymentToken).safeTransfer(backerAddr, payout);

            uint256 newDistributed = pos.distributedAmount + payout;
            bool capReached = newDistributed >= pos.maxCap;

            emit BackerPaid(agreementId, backerAddr, payout, newDistributed, capReached);
        }
    }
}
