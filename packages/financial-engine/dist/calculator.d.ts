import { BackerInput, CalculationResult } from './types.js';
export declare const BPS_DIVISOR = 10000n;
/**
 * Calculates the individual maximum return cap for a backer position.
 * @param fundedAmount The capital deposited by the backer
 * @param capMultiplierBps Cap multiplier in basis points (e.g. 20000n = 2.0x)
 */
export declare function calculateCap(fundedAmount: bigint, capMultiplierBps: bigint): bigint;
/**
 * Pure deterministic settlement calculation function.
 * Matches exact Solidity uint256 basis points arithmetic.
 */
export declare function calculateSettlement(params: {
    grossPayment: bigint;
    revenueShareBps: bigint;
    totalFunded: bigint;
    backers: BackerInput[];
}): CalculationResult;
