// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../src/MockUSDC.sol";
import "../src/AgreementManager.sol";
import "../src/SettlementEngine.sol";

contract SettlementEngineTest is Test {
    MockUSDC public usdc;
    AgreementManager public manager;
    SettlementEngine public engine;

    address public rahul = address(0x1001); // Earner
    address public backerA = address(0x2001); // 20% backer ($400)
    address public backerB = address(0x2002); // 30% backer ($600)
    address public backerC = address(0x2003); // 50% backer ($1,000)
    address public client = address(0x3001);  // Client / Payer

    uint256 public constant ONE_USDC = 1e6; // 6 decimals

    function setUp() public {
        usdc = new MockUSDC();
        manager = new AgreementManager();
        engine = new SettlementEngine(address(manager));

        manager.setSettlementEngine(address(engine));

        // Fund test accounts with USDC
        usdc.mint(backerA, 5000 * ONE_USDC);
        usdc.mint(backerB, 5000 * ONE_USDC);
        usdc.mint(backerC, 5000 * ONE_USDC);
        usdc.mint(client, 100_000 * ONE_USDC);

        // Approvals
        vm.prank(backerA);
        usdc.approve(address(manager), type(uint256).max);

        vm.prank(backerB);
        usdc.approve(address(manager), type(uint256).max);

        vm.prank(backerC);
        usdc.approve(address(manager), type(uint256).max);

        vm.prank(client);
        usdc.approve(address(engine), type(uint256).max);
    }

    function testCanonicalRahulWorkflow() public {
        // 1. Rahul creates agreement: $2,000 target, 10% rev share, 2.0x cap (20,000 BPS), 365 days
        vm.prank(rahul);
        uint256 agreementId = manager.createAgreement(
            address(usdc),
            2000 * ONE_USDC,
            1000,   // 10% (1,000 BPS)
            20000,  // 2.0x (20,000 BPS)
            365 days
        );

        // 2. Backers fund
        vm.prank(backerA);
        manager.fundAgreement(agreementId, 400 * ONE_USDC); // $400

        vm.prank(backerB);
        manager.fundAgreement(agreementId, 600 * ONE_USDC); // $600

        vm.prank(backerC);
        manager.fundAgreement(agreementId, 1000 * ONE_USDC); // $1,000

        // Agreement should now be fully funded ($2,000) and auto-activated!
        IAgreementManager.Agreement memory ag = manager.getAgreement(agreementId);
        assertEq(uint256(ag.status), uint256(IAgreementManager.AgreementStatus.ACTIVE));
        assertEq(ag.totalFunded, 2000 * ONE_USDC);

        // Rahul should have received the upfront $2,000 capital
        assertEq(usdc.balanceOf(rahul), 2000 * ONE_USDC);

        // 3. Client pays $1,000 for work done by Rahul
        uint256 rahulBalBefore = usdc.balanceOf(rahul);
        uint256 backerABalBefore = usdc.balanceOf(backerA);
        uint256 backerBBalBefore = usdc.balanceOf(backerB);
        uint256 backerCBalBefore = usdc.balanceOf(backerC);

        vm.prank(client);
        (uint256 earnerPayout, uint256 totalBackerPayout) = engine.settlePayment(
            agreementId,
            1000 * ONE_USDC,
            client
        );

        // Verify calculations:
        // Revenue share 10% of $1,000 = $100
        assertEq(totalBackerPayout, 100 * ONE_USDC);
        assertEq(earnerPayout, 900 * ONE_USDC);

        // Pro-rata allocations:
        // Backer A (20% share) -> $20
        assertEq(usdc.balanceOf(backerA) - backerABalBefore, 20 * ONE_USDC);

        // Backer B (30% share) -> $30
        assertEq(usdc.balanceOf(backerB) - backerBBalBefore, 30 * ONE_USDC);

        // Backer C (50% share) -> $50
        assertEq(usdc.balanceOf(backerC) - backerCBalBefore, 50 * ONE_USDC);

        // Rahul receives $900
        assertEq(usdc.balanceOf(rahul) - rahulBalBefore, 900 * ONE_USDC);

        // INVARIANT: SettlementEngine must have ZERO trapped funds
        assertEq(usdc.balanceOf(address(engine)), 0);
    }

    function testCapEnforcementAndTermination() public {
        // Rahul creates $1,000 agreement with 2.0x cap (20,000 BPS), 50% revenue share (5,000 BPS)
        vm.prank(rahul);
        uint256 agreementId = manager.createAgreement(
            address(usdc),
            1000 * ONE_USDC,
            5000,  // 50%
            20000, // 2.0x -> max cap = $2,000
            365 days
        );

        // Backer A funds $1,000 -> Max Cap is $2,000
        vm.prank(backerA);
        manager.fundAgreement(agreementId, 1000 * ONE_USDC);

        // Payment 1: $3,000 payment. 50% cut = $1,500.
        vm.prank(client);
        engine.settlePayment(agreementId, 3000 * ONE_USDC, client);

        IAgreementManager.BackerPosition memory pos = manager.getBackerPosition(agreementId, backerA);
        assertEq(pos.distributedAmount, 1500 * ONE_USDC);
        assertFalse(pos.isCompleted);

        // Payment 2: $2,000 payment. 50% theoretical cut = $1,000.
        // But remaining cap is $2,000 - $1,500 = $500!
        // Backer A should receive exactly $500, and Rahul should receive $1,500!
        uint256 backerABefore = usdc.balanceOf(backerA);
        uint256 rahulBefore = usdc.balanceOf(rahul);

        vm.prank(client);
        (uint256 earnerPayout, uint256 backerPayout) = engine.settlePayment(
            agreementId,
            2000 * ONE_USDC,
            client
        );

        assertEq(backerPayout, 500 * ONE_USDC);
        assertEq(earnerPayout, 1500 * ONE_USDC);
        assertEq(usdc.balanceOf(backerA) - backerABefore, 500 * ONE_USDC);
        assertEq(usdc.balanceOf(rahul) - rahulBefore, 1500 * ONE_USDC);

        // Backer A should now be completed!
        pos = manager.getBackerPosition(agreementId, backerA);
        assertEq(pos.distributedAmount, 2000 * ONE_USDC);
        assertTrue(pos.isCompleted);

        // Agreement should be marked COMPLETED
        IAgreementManager.Agreement memory ag = manager.getAgreement(agreementId);
        assertEq(uint256(ag.status), uint256(IAgreementManager.AgreementStatus.COMPLETED));

        // Settlement engine has 0 tokens remaining
        assertEq(usdc.balanceOf(address(engine)), 0);
    }
}
