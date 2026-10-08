export enum AgreementStatus {
  DRAFT = 'DRAFT',
  FUNDING = 'FUNDING',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export interface Agreement {
  id: string;
  chainAgreementId?: bigint;
  earnerAddress: string;
  earnerName?: string;
  paymentToken: string;
  fundingTarget: bigint;
  totalFunded: bigint;
  revenueShareBps: bigint; // e.g., 1000n = 10.00%
  capMultiplierBps: bigint; // e.g., 20000n = 2.0x
  totalDistributed: bigint;
  totalMaximumReturn: bigint;
  durationSeconds: bigint;
  startTime?: bigint;
  status: AgreementStatus;
  createdAt: Date;
}

export interface BackerPosition {
  id: string;
  agreementId: string;
  backerAddress: string;
  backerName?: string;
  fundedAmount: bigint;
  distributedAmount: bigint;
  maxCap: bigint;
  isCompleted: boolean;
  createdAt: Date;
}

export interface PaymentIntent {
  id: string;
  agreementId: string;
  invoiceId?: string;
  payerAddress: string;
  amount: bigint;
  currency: string;
  memo?: string;
  status: 'PENDING' | 'CONFIRMED' | 'SETTLED' | 'FAILED';
  createdAt: Date;
}

export interface BackerAllocation {
  backerAddress: string;
  fundedAmount: bigint;
  allocatedAmount: bigint;
  priorDistributed: bigint;
  newDistributed: bigint;
  maxCap: bigint;
  capReached: boolean;
}

export interface SettlementComputation {
  grossPayment: bigint;
  revenueShareBps: bigint;
  rawBackerPoolCut: bigint;
  actualTotalBackerPayout: bigint;
  earnerPayout: bigint;
  backerAllocations: BackerAllocation[];
  isAgreementCompleted: boolean;
}

export interface SettlementRecord {
  id: string;
  agreementId: string;
  paymentId: string;
  transactionHash: string;
  blockNumber: number;
  logIndex: number;
  grossAmount: bigint;
  earnerAmount: bigint;
  totalBackerAmount: bigint;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  agreementId: string;
  earnerAddress: string;
  clientName: string;
  clientEmail?: string;
  amount: bigint;
  currency: string;
  description: string;
  dueDate: Date;
  paymentUrl: string;
  status: 'UNPAID' | 'PAID' | 'VOID';
  createdAt: Date;
}
