export interface BackerInput {
  backerAddress: string;
  fundedAmount: bigint;
  distributedAmount: bigint;
  maxCap: bigint;
}

export interface CalculationResult {
  grossPayment: bigint;
  revenueShareBps: bigint;
  rawBackerPoolCut: bigint;
  actualTotalBackerPayout: bigint;
  earnerPayout: bigint;
  backerAllocations: {
    backerAddress: string;
    fundedAmount: bigint;
    allocatedAmount: bigint;
    priorDistributed: bigint;
    newDistributed: bigint;
    maxCap: bigint;
    capReached: boolean;
  }[];
  allBackersCompleted: boolean;
}
