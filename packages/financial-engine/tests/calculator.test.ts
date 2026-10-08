import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSettlement, calculateCap } from '../src/calculator.js';

describe('BackFlow Financial Engine - Canonical Test Suite', () => {
  const USDC_DECIMALS = 10n ** 6n; // 6 decimals standard for USDC

  test('Canonical Rahul Use Case: 3 Backers, 10% Rev Share, $1,000 Payment', () => {
    // Rahul funding target: $2,000
    const backerA_Funded = 400n * USDC_DECIMALS;  // $400
    const backerB_Funded = 600n * USDC_DECIMALS;  // $600
    const backerC_Funded = 1000n * USDC_DECIMALS; // $1,000
    const totalFunded = 2000n * USDC_DECIMALS;    // $2,000

    const capMultiplierBps = 20000n; // 2.0x

    const backers = [
      {
        backerAddress: '0xBackerA',
        fundedAmount: backerA_Funded,
        distributedAmount: 0n,
        maxCap: calculateCap(backerA_Funded, capMultiplierBps) // $800
      },
      {
        backerAddress: '0xBackerB',
        fundedAmount: backerB_Funded,
        distributedAmount: 0n,
        maxCap: calculateCap(backerB_Funded, capMultiplierBps) // $1,200
      },
      {
        backerAddress: '0xBackerC',
        fundedAmount: backerC_Funded,
        distributedAmount: 0n,
        maxCap: calculateCap(backerC_Funded, capMultiplierBps) // $2,000
      }
    ];

    // Client makes $1,000 payment
    const grossPayment = 1000n * USDC_DECIMALS;
    const revenueShareBps = 1000n; // 10%

    const result = calculateSettlement({
      grossPayment,
      revenueShareBps,
      totalFunded,
      backers
    });

    // Verify gross backer cut is $100 (10% of $1,000)
    assert.equal(result.rawBackerPoolCut, 100n * USDC_DECIMALS);
    assert.equal(result.actualTotalBackerPayout, 100n * USDC_DECIMALS);

    // Verify Earner gets $900
    assert.equal(result.earnerPayout, 900n * USDC_DECIMALS);

    // Verify pro-rata backer shares:
    // Backer A (20% of pool): $20
    assert.equal(result.backerAllocations[0].allocatedAmount, 20n * USDC_DECIMALS);
    assert.equal(result.backerAllocations[0].capReached, false);

    // Backer B (30% of pool): $30
    assert.equal(result.backerAllocations[1].allocatedAmount, 30n * USDC_DECIMALS);
    assert.equal(result.backerAllocations[1].capReached, false);

    // Backer C (50% of pool): $50
    assert.equal(result.backerAllocations[2].allocatedAmount, 50n * USDC_DECIMALS);
    assert.equal(result.backerAllocations[2].capReached, false);

    // Critical Invariant: Earner + Total Backers = Gross Payment
    assert.equal(result.earnerPayout + result.actualTotalBackerPayout, grossPayment);
  });

  test('Cap Enforcement: Backer reaches cap and excess cascades to Earner', () => {
    const totalFunded = 1000n * USDC_DECIMALS;
    const fundedAmount = 1000n * USDC_DECIMALS;
    const maxCap = 2000n * USDC_DECIMALS;

    // Backer has already received $1,980 out of $2,000 cap
    const priorDistributed = 1980n * USDC_DECIMALS;

    const backers = [
      {
        backerAddress: '0xSoloBacker',
        fundedAmount,
        distributedAmount: priorDistributed,
        maxCap
      }
    ];

    // A new payment of $1,000 arrives with 10% rev share ($100 raw cut)
    const grossPayment = 1000n * USDC_DECIMALS;
    const revenueShareBps = 1000n; // 10%

    const result = calculateSettlement({
      grossPayment,
      revenueShareBps,
      totalFunded,
      backers
    });

    // The backer is only owed $20 before hitting their $2,000 cap!
    assert.equal(result.backerAllocations[0].allocatedAmount, 20n * USDC_DECIMALS);
    assert.equal(result.backerAllocations[0].newDistributed, 2000n * USDC_DECIMALS);
    assert.equal(result.backerAllocations[0].capReached, true);
    assert.equal(result.allBackersCompleted, true);

    // Total backer payout should be clamped to $20
    assert.equal(result.actualTotalBackerPayout, 20n * USDC_DECIMALS);

    // Earner receives $1,000 - $20 = $980!
    // The $80 that would have gone to backer cascades to earner, no trapped funds!
    assert.equal(result.earnerPayout, 980n * USDC_DECIMALS);
    assert.equal(result.earnerPayout + result.actualTotalBackerPayout, grossPayment);
  });

  test('All Backers Completed: 100% of future revenue goes to Earner', () => {
    const totalFunded = 500n * USDC_DECIMALS;
    const backers = [
      {
        backerAddress: '0xMaxedBacker',
        fundedAmount: 500n * USDC_DECIMALS,
        distributedAmount: 1000n * USDC_DECIMALS,
        maxCap: 1000n * USDC_DECIMALS
      }
    ];

    const grossPayment = 500n * USDC_DECIMALS;
    const result = calculateSettlement({
      grossPayment,
      revenueShareBps: 2000n, // 20%
      totalFunded,
      backers
    });

    assert.equal(result.actualTotalBackerPayout, 0n);
    assert.equal(result.earnerPayout, 500n * USDC_DECIMALS);
    assert.equal(result.allBackersCompleted, true);
  });
});
