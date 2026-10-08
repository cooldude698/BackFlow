# BackFlow Protocol — Master Rules & Invariants

> **Status**: ACTIVE & MANDATORY  
> **Target Audience**: Core Developers (Aman, Prit), AI Agents, Security Auditors  
> **Last Updated**: October 2026  

---

## 1. The Core Architectural Invariants (Non-Negotiable)

### Rule 1.1: The Smart Contract Is the Single Source of Financial Truth
- **Violation**: Backend calculates `$100 to backer` and initiates payout $\rightarrow$ **INSTANT REJECTION**.
- **Correct Flow**:
  1. Payment arrives into `SettlementEngine.sol`.
  2. Smart contract reads active agreement terms and individual remaining caps from `AgreementManager.sol`.
  3. Smart contract computes pro-rata allocations in Basis Points (BPS).
  4. Smart contract atomically transfers tokens to backers and earner.
  5. Backend/Indexer merely reads and logs what settled on-chain.

### Rule 1.2: Zero Floating-Point Arithmetic
- **Solidity**: Use only `uint256`. Basis points divisor $D_{\text{BPS}} = 10,000$.
- **TypeScript**: Use native `bigint` (e.g. `1000n` for 10.00%, `10000n` for 100%).
- Never use JavaScript `number` or `parseFloat()` for token balances or allocations.

### Rule 1.3: Zero Trapped Funds Invariant
$$\sum_{i=1}^N \text{BackerPayout}_i + \text{EarnerPayout} = \text{GrossPayment}$$
At the end of every `settlePayment()` call:
- Contract ERC-20 token balance delta must equal strictly `0`.
- If any backer hits their cap, unallocated revenue share immediately cascades to the Earner.

### Rule 1.4: Terms Immutability Upon Activation
- Once an agreement enters `AgreementStatus.ACTIVE`, its financial parameters (`fundingTarget`, `revenueShareBps`, `capMultiplierBps`, `earner`) are strictly immutable.
- Admin or owner keys **cannot** alter revenue share percentages or caps post-activation.

---

## 2. Smart Contract Engineering Standards

1. **Compiler**: Solidity `^0.8.24` with `via_ir = true` and `optimizer_runs = 200`.
2. **Security Libraries**:
   - OpenZeppelin Contracts v5 (`SafeERC20`, `ReentrancyGuard`, `Ownable`).
   - Every external token transfer must use `safeTransfer` / `safeTransferFrom`.
3. **Pattern**: Strict Checks-Effects-Interactions (CEI).
   - Update internal accounting (`pos.distributedAmount`, `ag.totalDistributed`) *before* executing `safeTransfer`.
4. **Custom Errors vs Requires**:
   - Public settlement methods use descriptive error strings or custom errors to minimize gas while maintaining explicit revert reasons.
5. **Testing Gate**:
   - Zero commits to `main` without `forge test -vvv` passing 100%.

---

## 3. Backend & Indexer Rules

1. **Role of the Backend**:
   - The backend is a **coordination and read cache layer**, never a financial custodian.
2. **Idempotent Indexing**:
   - Every on-chain log must be indexed using the compound key `transaction_hash + ':' + log_index`.
   - Duplicate events must be ignored silently without secondary side-effects.
3. **Secret Key Safety**:
   - `RELAYER_PRIVATE_KEY` and database credentials must never be prefixed with `NEXT_PUBLIC_*`.
   - Never commit `.env` or raw private keys to version control.
4. **Viem Over Ethers**:
   - Use `viem` for contract event parsing, transaction encoding, and RPC interactions.

---

## 4. Frontend & Consumer Experience Rules

1. **Abbreviate the Blockchain**:
   - The payer (client) should never see gas popups, manual network switches, or raw hex errors.
   - Use Passkey authentication and sponsored transactions where possible.
2. **No Fake Optimistic Balances**:
   - The UI must only reflect settlement once the transaction receipt is confirmed on Monad testnet or indexer confirms event.
3. **Aesthetics & Premium Polish**:
   - Dark mode default (`#05070e` navy background, `#00F5A0` / `#14b8a6` brand accents).
   - Glassmorphic panels with subtle backdrop filters.
   - Accessible contrast, clear micro-animations, and responsive layouts.

---

## 5. Team Division of Ownership

- **Aman**:
  - Primary Owner: Smart Contracts (`contracts/`), Pure Financial Math (`packages/financial-engine`), Database (`database/`), Backend API & Event Indexer (`apps/api`).
- **Prit**:
  - Primary Owner: Consumer Payment Link (`apps/web/src/app/pay/`), Earner Dashboard (`apps/web/src/app/dashboard/`), Settlement Simulator (`apps/web/src/app/simulator/`), Design Tokens, Passkey/AA UX.
