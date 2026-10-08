// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../src/MockUSDC.sol";
import "../src/AgreementManager.sol";
import "../src/SettlementEngine.sol";
import "./handlers/SettlementHandler.sol";

contract SettlementEngineInvariantTest is Test {
    MockUSDC public usdc;
    AgreementManager public manager;
    SettlementEngine public engine;
    SettlementHandler public handler;

    function setUp() public {
        usdc = new MockUSDC();
        manager = new AgreementManager();
        engine = new SettlementEngine(address(manager));

        manager.setSettlementEngine(address(engine));

        handler = new SettlementHandler(usdc, manager, engine);

        // Direct invariant testing to only execute through the SettlementHandler
        targetContract(address(handler));
    }

    /// @notice Invariant 1: SettlementEngine must NEVER hold or trap any tokens.
    function invariant_zeroTrappedFundsSettlementEngine() public view {
        assertEq(
            usdc.balanceOf(address(engine)),
            0,
            "INVARIANT VIOLATION: SettlementEngine holds non-zero token balance"
        );
    }

    /// @notice Invariant 2: AgreementManager must NEVER trap any tokens once active/settling.
    function invariant_zeroTrappedFundsAgreementManager() public view {
        assertEq(
            usdc.balanceOf(address(manager)),
            0,
            "INVARIANT VIOLATION: AgreementManager holds non-zero token balance"
        );
    }

    /// @notice Invariant 3: Token Conservation - Gross payments must strictly equal BackerPayout + EarnerPayout.
    function invariant_conservationOfTokens() public view {
        assertEq(
            handler.ghost_totalGrossPaid(),
            handler.ghost_totalBackerPayout() + handler.ghost_totalEarnerPayout(),
            "INVARIANT VIOLATION: Conservation of tokens broken"
        );
    }

    /// @notice Invariant 4: No backer can ever receive more than their max cap.
    function invariant_capsNeverExceeded() public view {
        address[] memory backers = handler.getBackers();
        uint256 agreementId = handler.primaryAgreementId();

        for (uint256 i = 0; i < backers.length; i++) {
            IAgreementManager.BackerPosition memory pos = manager.getBackerPosition(agreementId, backers[i]);
            assertLe(
                pos.distributedAmount,
                pos.maxCap,
                "INVARIANT VIOLATION: Backer received distribution exceeding maxCap"
            );
            if (pos.isCompleted) {
                assertGe(
                    pos.distributedAmount,
                    pos.maxCap,
                    "INVARIANT VIOLATION: Backer marked completed before reaching maxCap"
                );
            }
        }
    }

    /// @notice Invariant 5: If all backers reach cap, agreement must transition to COMPLETED.
    function invariant_completionStateConsistency() public view {
        uint256 agreementId = handler.primaryAgreementId();
        IAgreementManager.Agreement memory ag = manager.getAgreement(agreementId);

        if (manager.areAllBackersCompleted(agreementId)) {
            assertEq(
                uint256(ag.status),
                uint256(IAgreementManager.AgreementStatus.COMPLETED),
                "INVARIANT VIOLATION: All backers completed but agreement is not COMPLETED"
            );
        }
    }
}
