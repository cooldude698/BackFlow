# Aman's Engineering Roadmap & Phase Breakdown

> **Owner**: Aman  
> **Domain**: Protocol Architecture, Smart Contracts, Financial Math, Backend Indexer & Database  
> **Order of Preference**: Phase 1 $\rightarrow$ Phase 2 $\rightarrow$ Phase 3 $\rightarrow$ Phase 4 $\rightarrow$ Phase 5  

---

## 🎯 Phase 1: Core Financial Math & Smart Contracts (P0 — MUST DO FIRST)
*Objective*: Build the deterministic protocol foundation. Nothing else can work until financial rules and contracts are verified.

- [x] **Task 1.1: Pure Financial Engine Math**
  - Path: `packages/financial-engine/src/calculator.ts`
  - Implement integer BPS calculations ($10,000 = 100\%$).
  - Implement cap clamping: $A_i = \min(E_i, C_i - D_i)$.
  - Verify zero trapped funds invariant.
  - Run: `npm run test:engine`.

- [x] **Task 1.2: Smart Contract Architecture**
  - Path: `contracts/src/AgreementManager.sol` & `SettlementEngine.sol`
  - Implement agreement lifecycle: `FUNDING` $\rightarrow$ `ACTIVE` $\rightarrow$ `COMPLETED`.
  - Isolate stack variables in helper functions to prevent EVM stack-too-deep.
  - Apply OpenZeppelin v5 `SafeERC20` and `ReentrancyGuard`.

- [x] **Task 1.3: Foundry Contract Tests**
  - Path: `contracts/test/SettlementEngine.t.sol`
  - Test canonical Rahul case: $2,000 target funded by 3 backers $\rightarrow$ $1,000 client payment settled ($100 to backers, $900 to Rahul).
  - Test cap reached and automatic agreement completion.
  - Run: `cd contracts && forge test -vvv`.

---

## 🚀 Phase 2: Monad Testnet Deployment (P0 — SECOND PRIORITY)
*Objective*: Push contracts live onto the Monad settlement rail and extract verified addresses.

- [x] **Task 2.1: Deployment Scripting**
  - Path: `contracts/script/Deploy.s.sol`
  - Configure broadcast script for `MockUSDC`, `AgreementManager`, and `SettlementEngine`.
  - Link engine via `manager.setSettlementEngine(engineAddress)`.

- [ ] **Task 2.2: Live Monad Broadcast**
  - Ensure deployer wallet has testnet MON from faucet.
  - Execute:
    ```bash
    cd contracts
    forge script script/Deploy.s.sol:DeployBackFlow \
      --rpc-url https://testnet-rpc.monad.xyz \
      --broadcast -vvvv
    ```
  - Record deployed addresses into `.env`.

- [ ] **Task 2.3: Explorer Verification**
  - Verify contract bytecode on `https://testnet.monadexplorer.com`.

---

## 🗄️ Phase 3: Database & Backend Event Indexer (P1 — THIRD PRIORITY)
*Objective*: Index on-chain state into PostgreSQL so Prit's frontend can query live data instantly.

- [x] **Task 3.1: PostgreSQL Migration**
  - Path: `database/migrations/001_initial_schema.sql`
  - Enforce `UNIQUE (transaction_hash, log_index)` to prevent duplicate accounting.

- [x] **Task 3.2: Express REST API Endpoints**
  - Path: `apps/api/src/server.ts`
  - Implement `GET /agreements`, `GET /agreements/:id`, `POST /agreements`, and `POST /agreements/:id/simulate-settlement`.

- [x] **Task 3.3: Real-Time Viem Event Consumer**
  - Path: `apps/api/src/indexer/blockchainListener.ts`
  - Connect Viem `watchContractEvent` to Monad RPC.
  - On `PaymentSettled`, execute idempotent insert into `settlements` table.

---

## ⚡ Phase 4: Payment Adapter & Relayer Rails (P1 — FOURTH PRIORITY)
*Objective*: Enable sponsored / gasless payments so clients don't need testnet gas.

- [x] **Task 4.1: Testnet Payment Adapter**
  - Path: `apps/api/src/adapters/TestnetPaymentAdapter.ts`
  - Provide payment session generation (`/pay/[agreementId]?session=...`).

- [x] **Task 4.2: Relayer Transaction Sponsorship**
  - Configure relayer signer using `RELAYER_PRIVATE_KEY` to wrap client payment calls.

---

## 🛡️ Phase 5: Fuzzing, Invariants & Security Polish (P2 — FINAL VERIFICATION)
*Objective*: Security hardening and performance optimization.

- [x] **Task 5.1: Milestone Console Runner**
  - Path: `scripts/simulate-milestone.ts`
  - Run: `npm run test:milestone`.

- [x] **Task 5.2: Invariant Fuzz Tests**
  - Add Foundry invariant test handler verifying that contract balance is zero after 1,000 random payment combinations.
