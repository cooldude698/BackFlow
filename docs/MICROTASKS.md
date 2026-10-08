# BackFlow — Granular Engineering Microtasks & DoD

## Phase 0: System Architecture & Master Rules (Completed)
- [x] **TASK-001**: Define non-negotiable architectural rules (`docs/MASTER_RULES.md`).
- [x] **TASK-002**: Draft PRD, TRD, and Architecture specifications (`docs/PRD.md`, `docs/TRD.md`, `docs/ARCHITECTURE.md`).
- [x] **TASK-003**: Formalize zero trapped funds mathematical proof (`docs/financial-model.md`).

---

## Phase 1: Pure Financial Engine (Completed - Aman)
- [x] **TASK-101**: Create `@backflow/financial-engine` package with native `bigint` math.
- [x] **TASK-102**: Implement `calculateSettlement()` with BPS divisor $10,000$.
- [x] **TASK-103**: Implement `calculateCap()` for backer multiplier calculations.
- [x] **TASK-104**: Write comprehensive unit tests for canonical Rahul use case (`tests/calculator.test.ts`).

---

## Phase 2: Smart Contract Protocol (Completed - Aman)
- [x] **TASK-201**: Implement `IAgreementManager` and `ISettlementEngine` interfaces.
- [x] **TASK-202**: Implement `AgreementManager.sol` with lifecycle state machine.
- [x] **TASK-203**: Implement `SettlementEngine.sol` with stack-isolated pro-rata router.
- [x] **TASK-204**: Configure Foundry with `via_ir = true` and `solc 0.8.24`.
- [x] **TASK-205**: Write comprehensive Foundry tests (`SettlementEngine.t.sol`) verifying Rahul test case and cap termination.

---

## Phase 3: Database & Event Indexer (Completed - Aman)
- [x] **TASK-301**: Author PostgreSQL migration `001_initial_schema.sql` with idempotency constraint.
- [x] **TASK-302**: Implement `BlockchainListener` class with deduplication on `tx_hash:log_index`.
- [x] **TASK-303**: Connect live Viem `watchContractEvent` listener to Monad testnet RPC.

---

## Phase 4: Backend API & Payment Rails (Completed - Aman)
- [x] **TASK-401**: Build Express REST server with `/agreements`, `/payments`, and `/simulate-settlement`.
- [x] **TASK-402**: Implement `TestnetPaymentAdapter` for session generation.
- [x] **TASK-403**: Implement relayer transaction submission endpoint with gas sponsorship.

---

## Phase 5: Frontend Design System & Checkout (Completed - Prit)
- [x] **TASK-501**: Build dark-mode glassmorphic Tailwind tokens and layout.
- [x] **TASK-502**: Implement protocol overview landing page (`/`).
- [x] **TASK-503**: Implement Earner Dashboard (`/dashboard`) with live syndicate table.
- [x] **TASK-504**: Implement Consumer Pay link (`/pay/[agreementId]`) with 1-click settlement.
- [x] **TASK-505**: Implement Interactive Settlement Simulator (`/simulator`).

---

## Phase 6: Passkey & Account Abstraction Polish (In Progress - Prit)
- [ ] **TASK-601**: Integrate WebAuthn passkey registration & credential prompt in `/pay/[id]`.
- [ ] **TASK-602**: Add confetti celebration animation upon transaction settlement confirmation.
- [ ] **TASK-603**: Add mobile QR code generator for invoice links.
