// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IAgreementManager.sol";

contract AgreementManager is IAgreementManager, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant BPS_DIVISOR = 10000;
    uint256 public nextAgreementId = 1;

    address public settlementEngine;

    mapping(uint256 => Agreement) private _agreements;
    mapping(uint256 => address[]) private _backerAddresses;
    mapping(uint256 => mapping(address => BackerPosition)) private _backerPositions;

    modifier onlySettlementEngine() {
        require(msg.sender == settlementEngine, "Only SettlementEngine can call");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setSettlementEngine(address _engine) external onlyOwner {
        require(_engine != address(0), "Invalid engine address");
        settlementEngine = _engine;
    }

    function createAgreement(
        address paymentToken,
        uint256 fundingTarget,
        uint256 revenueShareBps,
        uint256 capMultiplierBps,
        uint256 duration
    ) external returns (uint256 agreementId) {
        require(paymentToken != address(0), "Invalid token address");
        require(fundingTarget > 0, "Target must be > 0");
        require(revenueShareBps > 0 && revenueShareBps <= BPS_DIVISOR, "Invalid revenue share BPS");
        require(capMultiplierBps >= BPS_DIVISOR, "Cap multiplier must be >= 1.0x (10000 BPS)");
        require(duration > 0, "Duration must be > 0");

        agreementId = nextAgreementId++;

        uint256 maxReturn = (fundingTarget * capMultiplierBps) / BPS_DIVISOR;

        _agreements[agreementId] = Agreement({
            id: agreementId,
            earner: msg.sender,
            paymentToken: paymentToken,
            fundingTarget: fundingTarget,
            totalFunded: 0,
            revenueShareBps: revenueShareBps,
            capMultiplierBps: capMultiplierBps,
            totalMaximumReturn: maxReturn,
            totalDistributed: 0,
            duration: duration,
            startTime: 0,
            status: AgreementStatus.FUNDING
        });

        emit AgreementCreated(
            agreementId,
            msg.sender,
            paymentToken,
            fundingTarget,
            revenueShareBps,
            capMultiplierBps,
            duration
        );
    }

    function fundAgreement(uint256 agreementId, uint256 amount) external nonReentrant {
        Agreement storage ag = _agreements[agreementId];
        require(ag.id != 0, "Agreement does not exist");
        require(ag.status == AgreementStatus.FUNDING, "Agreement not in FUNDING state");
        require(amount > 0, "Amount must be > 0");
        require(ag.totalFunded + amount <= ag.fundingTarget, "Exceeds funding target");

        IERC20(ag.paymentToken).safeTransferFrom(msg.sender, address(this), amount);

        BackerPosition storage pos = _backerPositions[agreementId][msg.sender];
        if (pos.fundedAmount == 0) {
            _backerAddresses[agreementId].push(msg.sender);
        }

        pos.fundedAmount += amount;
        pos.maxCap = (pos.fundedAmount * ag.capMultiplierBps) / BPS_DIVISOR;
        ag.totalFunded += amount;

        emit BackerFunded(agreementId, msg.sender, amount, pos.maxCap);

        // Auto-activate once fully funded
        if (ag.totalFunded == ag.fundingTarget) {
            _activate(agreementId);
        }
    }

    function activateAgreement(uint256 agreementId) external nonReentrant {
        Agreement storage ag = _agreements[agreementId];
        require(ag.id != 0, "Agreement does not exist");
        require(ag.status == AgreementStatus.FUNDING, "Agreement not in FUNDING state");
        require(
            msg.sender == ag.earner || msg.sender == owner() || ag.totalFunded == ag.fundingTarget,
            "Unauthorized to activate"
        );
        require(ag.totalFunded > 0, "Cannot activate with zero funding");

        _activate(agreementId);
    }

    function _activate(uint256 agreementId) internal {
        Agreement storage ag = _agreements[agreementId];
        ag.status = AgreementStatus.ACTIVE;
        ag.startTime = block.timestamp;

        // Recalculate totalMaximumReturn if partially funded and activated
        ag.totalMaximumReturn = (ag.totalFunded * ag.capMultiplierBps) / BPS_DIVISOR;

        // Transfer upfront capital to the Earner!
        uint256 capital = ag.totalFunded;
        IERC20(ag.paymentToken).safeTransfer(ag.earner, capital);

        emit AgreementActivated(agreementId, ag.totalFunded, ag.startTime);
        emit AgreementStatusChanged(agreementId, AgreementStatus.FUNDING, AgreementStatus.ACTIVE);
    }

    function pauseAgreement(uint256 agreementId) external {
        Agreement storage ag = _agreements[agreementId];
        require(msg.sender == ag.earner || msg.sender == owner(), "Unauthorized");
        require(ag.status == AgreementStatus.ACTIVE, "Must be ACTIVE to pause");

        ag.status = AgreementStatus.PAUSED;
        emit AgreementStatusChanged(agreementId, AgreementStatus.ACTIVE, AgreementStatus.PAUSED);
    }

    function resumeAgreement(uint256 agreementId) external {
        Agreement storage ag = _agreements[agreementId];
        require(msg.sender == ag.earner || msg.sender == owner(), "Unauthorized");
        require(ag.status == AgreementStatus.PAUSED, "Must be PAUSED to resume");

        ag.status = AgreementStatus.ACTIVE;
        emit AgreementStatusChanged(agreementId, AgreementStatus.PAUSED, AgreementStatus.ACTIVE);
    }

    function recordSettlementDistribution(
        uint256 agreementId,
        address backer,
        uint256 amount
    ) external onlySettlementEngine {
        Agreement storage ag = _agreements[agreementId];
        BackerPosition storage pos = _backerPositions[agreementId][backer];

        pos.distributedAmount += amount;
        ag.totalDistributed += amount;

        if (pos.distributedAmount >= pos.maxCap) {
            pos.isCompleted = true;
        }
    }

    function markAgreementCompleted(uint256 agreementId) external onlySettlementEngine {
        Agreement storage ag = _agreements[agreementId];
        AgreementStatus old = ag.status;
        ag.status = AgreementStatus.COMPLETED;
        emit AgreementStatusChanged(agreementId, old, AgreementStatus.COMPLETED);
    }

    // View functions
    function getAgreement(uint256 agreementId) external view returns (Agreement memory) {
        return _agreements[agreementId];
    }

    function getBackerPosition(uint256 agreementId, address backer)
        external
        view
        returns (BackerPosition memory)
    {
        return _backerPositions[agreementId][backer];
    }

    function getBackers(uint256 agreementId) external view returns (address[] memory) {
        return _backerAddresses[agreementId];
    }

    function getBackerCount(uint256 agreementId) external view returns (uint256) {
        return _backerAddresses[agreementId].length;
    }

    function areAllBackersCompleted(uint256 agreementId) public view returns (bool) {
        address[] memory backers = _backerAddresses[agreementId];
        if (backers.length == 0) return true;

        for (uint256 i = 0; i < backers.length; i++) {
            if (!_backerPositions[agreementId][backers[i]].isCompleted) {
                return false;
            }
        }
        return true;
    }
}
