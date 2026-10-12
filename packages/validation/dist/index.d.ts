export declare const BPS_DIVISOR = 10000n;
export declare const MAX_REVENUE_SHARE_BPS = 10000n;
export declare const MIN_REVENUE_SHARE_BPS = 100n;
export declare function validateBasisPoints(bps: bigint): {
    valid: boolean;
    error?: string;
};
export declare function validateAgreementInput(params: {
    earnerAddress: string;
    fundingTarget: bigint;
    revenueShareBps: bigint;
    capMultiplierBps: bigint;
    durationSeconds: bigint;
}): {
    valid: boolean;
    errors: string[];
};
export declare function formatBpsToPercent(bps: bigint | number): string;
export declare function formatMultiplier(multiplierBps: bigint | number): string;
