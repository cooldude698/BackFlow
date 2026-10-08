export const BPS_DIVISOR = 10000n;
export const MAX_REVENUE_SHARE_BPS = 10000n; // 100%
export const MIN_REVENUE_SHARE_BPS = 100n; // 1% minimum

export function validateBasisPoints(bps: bigint): { valid: boolean; error?: string } {
  if (bps <= 0n) {
    return { valid: false, error: 'Revenue share BPS must be greater than 0' };
  }
  if (bps > MAX_REVENUE_SHARE_BPS) {
    return { valid: false, error: 'Revenue share cannot exceed 10,000 BPS (100%)' };
  }
  return { valid: true };
}

export function validateAgreementInput(params: {
  earnerAddress: string;
  fundingTarget: bigint;
  revenueShareBps: bigint;
  capMultiplierBps: bigint;
  durationSeconds: bigint;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!params.earnerAddress || !params.earnerAddress.startsWith('0x') || params.earnerAddress.length !== 42) {
    errors.push('Invalid Ethereum address for earner');
  }

  if (params.fundingTarget <= 0n) {
    errors.push('Funding target must be greater than zero');
  }

  const bpsCheck = validateBasisPoints(params.revenueShareBps);
  if (!bpsCheck.valid && bpsCheck.error) {
    errors.push(bpsCheck.error);
  }

  if (params.capMultiplierBps < 10000n) {
    errors.push('Cap multiplier must be at least 1.0x (10,000 BPS)');
  }

  if (params.durationSeconds <= 0n) {
    errors.push('Duration must be greater than zero seconds');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function formatBpsToPercent(bps: bigint | number): string {
  const num = typeof bps === 'bigint' ? Number(bps) : bps;
  return `${(num / 100).toFixed(2)}%`;
}

export function formatMultiplier(multiplierBps: bigint | number): string {
  const num = typeof multiplierBps === 'bigint' ? Number(multiplierBps) : multiplierBps;
  return `${(num / 10000).toFixed(2)}×`;
}
