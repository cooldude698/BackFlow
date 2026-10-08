# BackFlow Smart Contract Specification

## 1. Overview & Separation of Concerns

The protocol is split into two primary modular smart contracts to avoid single-contract bloat and enforce least-privilege security:

1. **`AgreementManager.sol`**
   - Registry and lifecycle engine for all BackFlow agreements.
   - Manages funding phases, backer registration, state transitions, and parameters.
   - Enforces immutability of financial terms once an agreement transitions to `ACTIVE`.

2. **`SettlementEngine.sol`**
   - Pure financial distribution router.
   - Accepts ERC-20 payment tokens for an agreement ID.
   - Queries `AgreementManager` for terms, active backer positions, and individual remaining caps.
   - Calculates pro-rata revenue allocations using Basis Points (BPS) math with zero precision loss.
   - Enforces cap logic (`min(allocated, remainingCap)`).
   - Distributes backer shares immediately to backer addresses and routes earner net balance.
   - Emits granular settlement events.

---

## 2. Agreement Data Structures & State Machine

### 2.1 State Enum
```solidity
enum AgreementStatus {
    DRAFT,      // Initial setup, not open for public funding
    FUNDING,    // Open for backers to deposit capital
    ACTIVE,     // Funding target met or earner activated; revenue share active
    PAUSED,     // Emergency pause by earner or protocol admin
    COMPLETED,  // All backer caps reached OR duration expired with terms fulfilled
    EXPIRED,    // Duration elapsed without cap reached
    CANCELLED   // Funding target failed or canceled during DRAFT/FUNDING
}
```

### 2.2 Agreement Struct
```solidity
struct Agreement {
    uint256 id;
    address earner;
    address paymentToken;       // ERC-20 token address (e.g., USDC)
    uint256 fundingTarget;      // Total amount in token decimals
    uint256 totalFunded;        // Current accumulated funding
    uint256 revenueShareBps;    // Revenue share in basis points (100 BPS = 1.00%, max 10000)
    uint256 capMultiplierBps;   // Cap multiplier in BPS (e.g., 20000 BPS = 2.0x, or fixed total cap)
    uint256 totalMaximumReturn; // Total backer payout cap across all backers
    uint256 totalDistributed;   // Cumulative revenue share paid to backers so far
    uint256 startTime;          // Timestamp when agreement became ACTIVE
    uint256 duration;           // Duration in seconds (e.g. 365 days)
    AgreementStatus status;
}
```

### 2.3 Backer Position Struct
```solidity
struct BackerPosition {
    uint256 fundedAmount;       // Amount of capital provided by this backer
    uint256 distributedAmount;    // Cumulative revenue share received by this backer
    uint256 maxCap;             // Individual cap (fundedAmount * capMultiplierBps / 10000)
    bool isCompleted;           // True if distributedAmount >= maxCap
}
```

---

## 3. Financial Mathematics & Settlement Logic

### 3.1 Basis Points Precision
- `100 BPS = 1%`
- `10,000 BPS = 100%`
- All divisions are performed after multiplications to minimize round-off error:
  $$\text{Target Revenue Share} = \frac{\text{Payment Amount} \times \text{revenueShareBps}}{10000}$$

### 3.2 Multi-Backer Pro-Rata Distribution
When a payment $P$ enters the `SettlementEngine`:
1. Calculate protocol backer cut:
   $$R_{\text{raw}} = \frac{P \times \text{revenueShareBps}}{10000}$$
2. For each active backer $i$:
   - Calculate theoretical pro-rata entitlement:
     $$E_i = \frac{R_{\text{raw}} \times \text{fundedAmount}_i}{\text{totalFunded}}$$
   - Calculate remaining cap:
     $$C_i = \max(0, \text{maxCap}_i - \text{distributedAmount}_i)$$
   - Actual payout to backer $i$:
     $$A_i = \min(E_i, C_i)$$
   - If $A_i == C_i$, backer position is marked `isCompleted = true`.
3. Total actual backer distribution:
   $$R_{\text{actual}} = \sum A_i$$
4. Earner payout:
   $$P_{\text{earner}} = P - R_{\text{actual}}$$
   *(Notice: any excess revenue resulting from capped backers immediately flows to the earner, ensuring zero trapped funds!)*
5. If all backers are completed ($R_{\text{actual}} == 0$ and all $C_i == 0$), transition agreement state to `COMPLETED`.

---

## 4. Key Events

- `AgreementCreated(uint256 indexed agreementId, address indexed earner, uint256 fundingTarget, uint256 revenueShareBps, uint256 duration)`
- `BackerFunded(uint256 indexed agreementId, address indexed backer, uint256 amount, uint256 maxCap)`
- `AgreementActivated(uint256 indexed agreementId, uint256 totalFunded, uint256 startTime)`
- `PaymentSettled(uint256 indexed agreementId, address indexed payer, uint256 grossAmount, uint256 backerShare, uint256 earnerShare)`
- `BackerPaid(uint256 indexed agreementId, address indexed backer, uint256 amountPaid, uint256 totalReceived, bool capReached)`
- `AgreementCompleted(uint256 indexed agreementId, uint256 totalDistributed)`
- `AgreementPaused(uint256 indexed agreementId)`
- `AgreementResumed(uint256 indexed agreementId)`
