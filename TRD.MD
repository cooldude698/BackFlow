# BackFlow — Technical Requirements Document (TRD)

> **Document Version**: 1.0  
> **Status**: APPROVED  
> **Lead Stakeholders**: Aman (Contracts/Backend) & Prit (Frontend/Web3 UX)  
> **Target Environment**: Monad Testnet / Node.js 20+ / Next.js 15  

---

## 1. System Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Smart Contracts** | Solidity | `^0.8.24` | Core settlement and agreement protocol |
| **Contract Framework** | Foundry (`forge`, `cast`, `anvil`) | `v1.8.5+` | Compilation, invariant testing, deployment |
| **Security Standards** | OpenZeppelin Contracts | `v5.7.0` | `SafeERC20`, `ReentrancyGuard`, `Ownable` |
| **Target Blockchain** | Monad Testnet | Chain ID `10143` | EVM high-throughput settlement rail |
| **Financial Engine** | Pure TypeScript (`bigint`) | `ES2022` | Deterministic offline verification & simulation |
| **Backend API** | Node.js + Express / Fastify | Node `20+` | Coordination API & Payment Intent sessions |
| **Blockchain Client** | Viem | `^2.21.0` | Log ingestion, contract read/writes, encoding |
| **Database** | PostgreSQL / Supabase | `v15+` | Read-optimized transaction and invoice mirror |
| **Frontend Framework** | Next.js (App Router) | `15.1+` | Consumer checkout & earner dashboards |
| **UI & Styling** | React 19 + TailwindCSS | `v3.4+` | Glassmorphic design system |

---

## 2. Smart Contract Technical Specification

### 2.1 Foundry Configuration (`foundry.toml`)
```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.24"
optimizer = true
optimizer_runs = 200
via_ir = true

remappings = [
    "@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/",
    "forge-std/=lib/forge-std/src/"
]

[rpc_endpoints]
monad_testnet = "https://testnet-rpc.monad.xyz"
```

### 2.2 Contract Decomposition
1. **`AgreementManager.sol`**:
   - Holds agreement state machine: `DRAFT` $\rightarrow$ `FUNDING` $\rightarrow$ `ACTIVE` $\rightarrow$ `COMPLETED` / `EXPIRED`.
   - Records backer balances: `_backerPositions[agreementId][backer]`.
   - Authorized methods: `recordSettlementDistribution` and `markAgreementCompleted` guarded by `onlySettlementEngine`.
2. **`SettlementEngine.sol`**:
   - Stateless execution router for payments.
   - Accepts ERC-20 `grossAmount` from payer via `safeTransferFrom`.
   - Calculates allocations using isolated internal functions (`_distributeToBackers`, `_processSingleBacker`) to prevent stack-too-deep.
   - Pushes token payouts immediately via `safeTransfer`.
   - Guarantees zero residual token balance inside the router.

---

## 3. Financial Engine Technical Requirements

- Package Name: `@backflow/financial-engine`
- Precision Constant: `BPS_DIVISOR = 10000n`
- Invariant Assertion:
  $$\text{assert}(\text{earnerPayout} + \text{actualTotalBackerPayout} === \text{grossPayment})$$
- Test Requirements:
  - 100% test coverage for standard distributions, cap clamping, multiple backer syndicates, zero payment edge cases, and completed agreement termination.

---

## 4. Backend & Indexer Technical Requirements

### 4.1 Event Indexing Pipeline
- Event Subscriptions:
  - `AgreementCreated`
  - `BackerFunded`
  - `AgreementActivated`
  - `PaymentSettled`
  - `BackerPaid`
  - `AgreementStatusChanged`
- Deduplication Key: `${transactionHash}:${logIndex}`
- Database Write Isolation: Wrapped in PostgreSQL transaction blocks.

### 4.2 REST API Specifications
- Framework: Express / Fastify with JSON middleware and CORS allowlisting.
- Serializer: Native `BigInt` serializer mapping `bigint` values to strings.

---

## 5. Security & Isolation Matrix

1. **Reentrancy**: Protected via `ReentrancyGuard` across `fundAgreement` and `settlePayment`.
2. **Transfer Safety**: All token actions wrapped in `SafeERC20`.
3. **Environment Separation**:
   - `apps/web`: Zero access to private keys or privileged RPC endpoints.
   - `apps/api`: Private keys held strictly in memory from environment variables.
