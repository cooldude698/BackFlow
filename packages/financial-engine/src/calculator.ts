import { BackerInput, CalculationResult } from './types.js';

export const BPS_DIVISOR = 10000n;

/**
 * Calculates the individual maximum return cap for a backer position.
 * @param fundedAmount The capital deposited by the backer
 * @param capMultiplierBps Cap multiplier in basis points (e.g. 20000n = 2.0x)
 */
export function calculateCap(fundedAmount: bigint, capMultiplierBps: bigint): bigint {
  return (fundedAmount * capMultiplierBps) / BPS_DIVISOR;
}

/**
 * Pure deterministic settlement calculation function.
 * Matches exact Solidity uint256 basis points arithmetic.
 */
export function calculateSettlement(params: {
  grossPayment: bigint;
  revenueShareBps: bigint;
  totalFunded: bigint;
  backers: BackerInput[];
}): CalculationResult {
  const { grossPayment, revenueShareBps, totalFunded, backers } = params;

  if (grossPayment < 0n) throw new Error('grossPayment cannot be negative');
  if (revenueShareBps < 0n || revenueShareBps > BPS_DIVISOR) {
    throw new Error('revenueShareBps must be between 0 and 10000');
  }
  if (totalFunded <= 0n) throw new Error('totalFunded must be positive');

  // 1. Raw target backer pool cut
  const rawBackerPoolCut = (grossPayment * revenueShareBps) / BPS_DIVISOR;

  let actualTotalBackerPayout = 0n;
  const backerAllocations = [];

  // 2. Iterate through backers and allocate pro-rata with cap clamp
  for (const backer of backers) {
    const remainingCap =
      backer.maxCap > backer.distributedAmount
        ? backer.maxCap - backer.distributedAmount
        : 0n;

    let allocatedAmount = 0n;

    if (remainingCap > 0n && rawBackerPoolCut > 0n) {
      // Pro-rata based on backer's share of total funded capital
      const theoreticalShare = (rawBackerPoolCut * backer.fundedAmount) / totalFunded;
      // Clamp to remaining cap
      allocatedAmount = theoreticalShare < remainingCap ? theoreticalShare : remainingCap;
    }

    const newDistributed = backer.distributedAmount + allocatedAmount;
    const capReached = newDistributed >= backer.maxCap;

    actualTotalBackerPayout += allocatedAmount;

    backerAllocations.push({
      backerAddress: backer.backerAddress,
      fundedAmount: backer.fundedAmount,
      allocatedAmount,
      priorDistributed: backer.distributedAmount,
      newDistributed,
      maxCap: backer.maxCap,
      capReached
    });
  }

  // 3. Earner receives the remainder (guarantees zero trapped funds)
  const earnerPayout = grossPayment - actualTotalBackerPayout;

  // Invariant verification
  if (earnerPayout + actualTotalBackerPayout !== grossPayment) {
    throw new Error('CRITICAL INVARIANT VIOLATION: Total payouts do not equal gross payment');
  }

  const allBackersCompleted = backerAllocations.every((b) => b.capReached);

  return {
    grossPayment,
    revenueShareBps,
    rawBackerPoolCut,
    actualTotalBackerPayout,
    earnerPayout,
    backerAllocations,
    allBackersCompleted
  };
}
