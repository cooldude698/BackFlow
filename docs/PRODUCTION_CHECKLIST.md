# BackFlow — Production & Hackathon Launch Checklist

## 1. Smart Contract Readiness (Aman)

- [x] **Solidity Invariant Verification**: Zero trapped funds invariant mathematically proven.
- [x] **ReentrancyGuard**: Inherited on `AgreementManager` and `SettlementEngine`.
- [x] **SafeERC20**: Implemented on all `safeTransfer` and `safeTransferFrom` calls.
- [x] **Checks-Effects-Interactions**: State updated before any token transfer.
- [x] **Via-IR Enabled**: `via_ir = true` and `optimizer_runs = 200` in `foundry.toml`.
- [x] **Foundry Test Suite**: 100% test passing (`forge test -vvv`).
- [ ] **Monad Testnet Deployment**:
  - [ ] Deployer funded with testnet MON.
  - [ ] `MockUSDC`, `AgreementManager`, `SettlementEngine` deployed.
  - [ ] `manager.setSettlementEngine(engineAddress)` executed.
  - [ ] Addresses verified on Monad explorer.

---

## 2. Backend & Indexer Readiness (Aman)

- [x] **Database Schema**: `database/migrations/001_initial_schema.sql` prepared.
- [x] **Idempotency Constraint**: `UNIQUE (transaction_hash, log_index)` in `settlements`.
- [x] **Seed Data Ready**: Rahul canonical agreement (`BF-001`) seeded for instant demo.
- [x] **BigInt Serialization**: BigInt safely serialized to strings in JSON API responses.
- [ ] **Environment Isolation**: `RELAYER_PRIVATE_KEY` locked to server environment.

---

## 3. Frontend & Consumer Experience Readiness (Prit)

- [x] **Next.js Production Build**: `next build` produces clean static & dynamic routes.
- [x] **Responsive Layout**: Dark mode glassmorphic UI verified on desktop and mobile.
- [x] **Client Checkout View**: `/pay/BF-001` renders clear invoice and 1-click payment flow.
- [x] **Settlement Preview Waterfall**: Shows 90% earner cut and 10% backer pro-rata split.
- [x] **Interactive Simulator**: `/simulator` operational for judge live experiments.
- [ ] **Passkey WebAuthn Verification**: Biometric prompt tested on Safari / Chrome.

---

## 4. Hackathon Demo Day Checklist (Team)

- [x] Permanent Demo Agreement (`BF-001` - Rahul: $2,000 target, 10% rev share, 2× cap).
- [x] Console telemetry simulation runnable via `npm run test:milestone`.
- [ ] 2-Minute Pitch Narrative:
  - *Hook*: Freelancers need capital without bank loans or giving up equity.
  - *The Magic*: Client pays normal invoice $\rightarrow$ Smart contract automatically splits money on Monad $\rightarrow$ Zero manual bookkeeping.
  - *The Moat*: Contract is single source of financial truth; caps enforce finite return.
