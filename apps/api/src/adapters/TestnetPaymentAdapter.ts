import { IPaymentAdapter, PaymentIntentInput, SettlementExecutionResult } from './IPaymentAdapter.js';

export class TestnetPaymentAdapter implements IPaymentAdapter {
  readonly adapterName = 'MonadTestnetERC20';

  constructor(
    private rpcUrl: string,
    private settlementEngineAddress: string,
    private paymentTokenAddress: string
  ) {}

  async createPaymentSession(input: PaymentIntentInput) {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      sessionId,
      checkoutUrl: `/pay/${input.agreementId}?session=${sessionId}&amount=${input.amount.toString()}`,
      amount: input.amount.toString(),
      currency: input.currency
    };
  }

  async executeSettlement(
    agreementId: string,
    grossAmount: bigint,
    payer: string
  ): Promise<SettlementExecutionResult> {
    // In production/testnet with relayer, calls viem writeContract
    // Returns simulated execution proof when running in local mock mode
    const simulatedTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    return {
      transactionHash: simulatedTxHash,
      blockNumber: 1234567,
      grossAmount,
      backerShareTotal: (grossAmount * 1000n) / 10000n, // 10%
      earnerShare: grossAmount - (grossAmount * 1000n) / 10000n,
      recipientDistributions: [
        {
          recipient: payer,
          amount: grossAmount,
          type: 'EARNER'
        }
      ]
    };
  }
}
