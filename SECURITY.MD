# BackFlow — Security Architecture & Threat Matrix (Audit Grade)

## 1. Threat Model & STRIDE Analysis

| STRIDE Category | Threat Description | BackFlow Mitigation Strategy |
| :--- | :--- | :--- |
| **Spoofing** | Impersonating Earner to divert future revenue | Earner address permanently stored in `AgreementManager`; payout recipient is strictly `agreement.earner`. |
| **Tampering** | Altering revenue share BPS or cap post-activation | Agreement parameters are immutable once status $\ne$ `DRAFT`. State transitions strictly one-way. |
| **Repudiation** | Claiming a payment was never settled | Atomic on-chain settlement emits `PaymentSettled` and `BackerPaid` indexed with transaction hash. |
| **Information Disclosure** | Exposing relayer private keys or sensitive client data | Zero private keys exposed in web bundle; API runs inside isolated VPC with environment secrets. |
| **Denial of Service** | Flooding agreement with micro-fundings to bloat gas | Minimum funding threshold enforced; loop bounded to syndicate size (maximum 50 backers in prototype). |
| **Elevation of Privilege** | Protocol Owner stealing backer or earner escrow | Owner has zero withdrawal function on active agreements. Only allowed to set initial settlement engine address. |

---

## 2. Smart Contract Defense-in-Depth

### 2.1 Checks-Effects-Interactions (CEI) Invariant
Internal state modifications must precede all external token calls:
```solidity
// 1. CHECKS
require(rawBackerCut > 0, "No cut");

// 2. EFFECTS (Update on-chain accounting before token transfer)
agreementManager.recordSettlementDistribution(agreementId, backerAddr, payout);

// 3. INTERACTIONS (External token transfer executed last)
IERC20(paymentToken).safeTransfer(backerAddr, payout);
```

### 2.2 Reentrancy Protection
- Both `AgreementManager` and `SettlementEngine` inherit OpenZeppelin's `ReentrancyGuard`.
- All state-modifying endpoints (`fundAgreement`, `settlePayment`, `activateAgreement`) are marked `nonReentrant`.

### 2.3 SafeERC20 Protection
- Interacts only via `SafeERC20.safeTransfer` and `SafeERC20.safeTransferFrom`.
- Prevents silent failures on non-compliant ERC-20 tokens that return `void` instead of boolean `true`.

---

## 3. Key Management & Operations

1. **Deployer / Relayer Key**:
   - Stored in KMS / Hardware security module or dedicated environment variable `RELAYER_PRIVATE_KEY`.
   - Relayer holds only minimal testnet native gas necessary for sponsoring transactions.
2. **Admin Powers**:
   - Zero ability to modify existing agreement percentages or redirect settled revenue.
   - Emergency `pauseAgreement` available only to the agreement's Earner or protocol owner.

---

## 4. Incident Response & Bug Bounty Protocol

- **Vulnerability Disclosure**: Report security vulnerabilities to `security@backflow.app`.
- **Circuit Breaker Procedure**: If an exploit is identified, execute `pauseAgreement()` immediately. Escrowed funds remain locked in escrow until patched contracts are deployed.
