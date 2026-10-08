# BackFlow Payment Flow & Integration Architecture

## 1. End-to-End Consumer Payment Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client / Payer
    participant Web as BackFlow Pay Web App
    participant Relayer as BackFlow Relayer / Bundler
    participant ERC20 as Payment Token (USDC)
    participant Engine as SettlementEngine.sol
    participant Mgr as AgreementManager.sol
    actor Earner as Earner Wallet
    actor Backers as Backer Wallets

    Client->>Web: Opens Payment Link (e.g. backflow.app/pay/rahul)
    Web->>Client: Displays Invoice & Payment Summary ($1,000 USDC)
    Client->>Web: Authenticates via Passkey / Web3 Session
    Client->>ERC20: Approve / Permit SettlementEngine for $1,000
    Client->>Relayer: Submit Payment Intent (Sponsored gas or direct tx)
    Relayer->>Engine: settlePayment(agreementId, $1,000, payer)
    Engine->>Mgr: Query agreement terms, backers, caps
    Mgr-->>Engine: Returns (revenueShareBps, backerList, caps)
    Engine->>ERC20: transferFrom(Client, address(this), $1,000)
    Engine->>ERC20: transfer(Backer1, $20)
    Engine->>ERC20: transfer(Backer2, $30)
    Engine->>ERC20: transfer(Backer3, $50)
    Engine->>ERC20: transfer(Earner, $900)
    Engine->>Mgr: recordSettlement(totalBackerPaid)
    Engine-->>Relayer: Emit PaymentSettled event
    Relayer-->>Web: Confirmation Receipt with Tx Hash
    Web-->>Client: "Payment Settled Instantly!"
```

---

## 2. Payment Adapter Abstraction

To ensure BackFlow easily integrates future fiat on-ramps (Stripe, MoonPay) without touching smart contract settlement logic, we introduce a polymorphic payment adapter:

```typescript
export interface PaymentIntent {
  agreementId: string;
  invoiceId?: string;
  payerAddress: string;
  amount: bigint;
  currency: string;
  metadata?: Record<string, any>;
}

export interface PaymentSettlementResult {
  transactionHash: string;
  blockNumber: number;
  grossAmount: bigint;
  backerShareTotal: bigint;
  earnerShare: bigint;
  backerDistributions: {
    backerAddress: string;
    amount: bigint;
    capReached: boolean;
  }[];
}

export interface IPaymentAdapter {
  name: string;
  createPaymentIntent(intent: PaymentIntent): Promise<{ paymentUrl: string; paymentId: string }>;
  settle(intent: PaymentIntent, signerOrRelayer: any): Promise<PaymentSettlementResult>;
}
```

---

## 3. Direct Distribution vs Claim-Based Settlements

- **Current Prototype (Direct Distribution)**:
  - For syndicates up to 20-50 backers, executing direct batch token transfers in `settlePayment()` provides an extraordinary user experience.
  - Backers immediately see funds arrive in their wallets with zero claiming friction.
- **Future Scale Path (Accounting + Merkle / Claim)**:
  - When backer pools scale to thousands, `SettlementEngine` transitions to virtual balance accounting (`claimableBalance[backer] += share`), allowing backers to batch claim when gas-optimal.
