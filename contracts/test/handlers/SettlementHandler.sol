// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../../src/MockUSDC.sol";
import "../../src/AgreementManager.sol";
import "../../src/SettlementEngine.sol";

contract SettlementHandler is Test {
    MockUSDC public usdc;
    AgreementManager public manager;
    SettlementEngine public engine;

    uint256 public constant ONE_USDC = 1e6;

    address public earner = address(0xEAEA);
    address[] public backers;
    address[] public payers;

    uint256 public primaryAgreementId;

    // Ghost variables for invariant tracking
    uint256 public ghost_totalGrossPaid;
    uint256 public ghost_totalBackerPayout;
    uint256 public ghost_totalEarnerPayout;
    uint256 public ghost_settlementCount;

    constructor(
        MockUSDC _usdc,
        AgreementManager _manager,
        SettlementEngine _engine
    ) {
        usdc = _usdc;
        manager = _manager;
        engine = _engine;

        // Setup 3 backers
        backers.push(address(0xB001));
        backers.push(address(0xB002));
        backers.push(address(0xB003));

        // Setup 3 payers
        payers.push(address(0xC001));
        payers.push(address(0xC002));
        payers.push(address(0xC003));

        // Create and fund primary agreement
        vm.prank(earner);
        primaryAgreementId = manager.createAgreement(
            address(usdc),
            2000 * ONE_USDC, // $2,000 target
            1500,            // 15% rev share (1,500 BPS)
            20000,           // 2.0x cap (20,000 BPS)
            365 days
        );

        // Fund agreement: 500, 500, 1000 = 2000 USDC
        uint256[3] memory fundingAmounts = [uint256(500 * ONE_USDC), uint256(500 * ONE_USDC), uint256(1000 * ONE_USDC)];
        for (uint256 i = 0; i < backers.length; i++) {
            usdc.mint(backers[i], fundingAmounts[i]);
            vm.prank(backers[i]);
            usdc.approve(address(manager), fundingAmounts[i]);
            vm.prank(backers[i]);
            manager.fundAgreement(primaryAgreementId, fundingAmounts[i]);
        }
    }

    function settlePayment(uint256 rawAmount, uint256 payerIndex) external {
        // Bound payment between 1 USDC and 50,000 USDC
        uint256 grossAmount = bound(rawAmount, 1 * ONE_USDC, 50_000 * ONE_USDC);
        address payer = payers[payerIndex % payers.length];

        IAgreementManager.Agreement memory ag = manager.getAgreement(primaryAgreementId);
        // Only settle if agreement is ACTIVE
        if (ag.status != IAgreementManager.AgreementStatus.ACTIVE) {
            return;
        }

        // Mint USDC to payer and approve SettlementEngine
        usdc.mint(payer, grossAmount);
        vm.prank(payer);
        usdc.approve(address(engine), grossAmount);

        // Record balances prior to settlement
        uint256 earnerBefore = usdc.balanceOf(ag.earner);
        uint256[] memory backersBefore = new uint256[](backers.length);
        for (uint256 i = 0; i < backers.length; i++) {
            backersBefore[i] = usdc.balanceOf(backers[i]);
        }

        vm.prank(payer);
        (uint256 earnerPayout, uint256 totalBackerPayout) = engine.settlePayment(
            primaryAgreementId,
            grossAmount,
            payer
        );

        // Verify transfer deltas match payouts
        uint256 earnerDelta = usdc.balanceOf(ag.earner) - earnerBefore;
        assertEq(earnerDelta, earnerPayout, "Earner balance delta mismatch");

        uint256 actualBackerDeltaSum = 0;
        for (uint256 i = 0; i < backers.length; i++) {
            actualBackerDeltaSum += (usdc.balanceOf(backers[i]) - backersBefore[i]);
        }
        assertEq(actualBackerDeltaSum, totalBackerPayout, "Backer balance delta mismatch");

        // Update ghosts
        ghost_totalGrossPaid += grossAmount;
        ghost_totalBackerPayout += totalBackerPayout;
        ghost_totalEarnerPayout += earnerPayout;
        ghost_settlementCount++;
    }

    function getBackers() external view returns (address[] memory) {
        return backers;
    }
}
