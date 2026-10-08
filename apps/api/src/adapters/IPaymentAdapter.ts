export interface PaymentIntentInput {
  agreementId: string;
  invoiceId?: string;
  payerAddress: string;
  amount: bigint;
  currency: string;
}

export interface SettlementExecutionResult {
  transactionHash: string;
  blockNumber: number;
  grossAmount: bigint;
  backerShareTotal: bigint;
  earnerShare: bigint;
  recipientDistributions: {
    recipient: string;
    amount: bigint;
    type: 'EARNER' | 'BACKER';
  }[];
  sponsoredByRelayer?: boolean;
}

export interface IPaymentAdapter {
  readonly adapterName: string;
  createPaymentSession(input: PaymentIntentInput): Promise<{
    sessionId: string;
    checkoutUrl: string;
    amount: string;
    currency: string;
  }>;
  executeSettlement(
    agreementId: string,
    grossAmount: bigint,
    payer: string
  ): Promise<SettlementExecutionResult>;
}
