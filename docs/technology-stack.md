# BackFlow Technology Stack & Architectural Decision Records (ADR)

## 1. Architectural Philosophy

BackFlow is designed to bridge decentralized programmable settlement with consumer-grade payment experiences. The system is architected around four distinct layers:

1. **Deterministic Settlement Layer (Blockchain)**
2. **Coordination & Indexing Layer (Backend API & Event Consumer)**
3. **Storage & Audit Layer (PostgreSQL / Supabase)**
4. **Consumer Interaction Layer (Next.js & Account Abstraction)**

---

## 2. Layer-by-Layer Technology Stack

### 2.1 Settlement Layer (Blockchain)
- **Target Network**: Monad Testnet (EVM-compatible, 10,000 TPS, 1-second finality, ultra-low gas).
- **Contract Language**: Solidity `^0.8.24` with EVM Shanghai/Cancun target.
- **Framework**: Foundry (`forge`, `cast`, `anvil`) for high-speed compilation, fuzzing, invariant testing, and deployment scripts.
- **Security Libraries**: OpenZeppelin Contracts v5:
  - `SafeERC20` & `IERC20`: Non-reentrant, safe token interactions.
  - `ReentrancyGuard`: CEI-enforced reentrancy protection.
  - `Ownable`: Restricted administrative functions (pause/unpause only).
- **Payment Asset**: Standard ERC-20 stablecoin (e.g., testnet USDC with 6 or 18 decimals).

### 2.2 Financial Calculation Engine
- **Language**: TypeScript (`ES2022`).
- **Package**: `@backflow/financial-engine`.
- **Runtime**: Native Node.js `node:test` and `tsx`.
- **Design Principle**: Pure functional math using native JavaScript `bigint` types. Zero floating-point math. Mimics exact Solidity 256-bit unsigned integer behavior before contract execution.

### 2.3 Backend API & Event Indexer
- **Framework**: Node.js with Fastify / Express + TypeScript.
- **Blockchain Client**: `viem` (lightweight, modular, type-safe EVM interface) and `wagmi`.
- **Event Listener**: Real-time websocket & polling subscription on `AgreementManager` and `SettlementEngine` events (`PaymentSettled`, `BackerFunded`, `AgreementCompleted`).
- **Idempotency Strategy**: Compound unique index `(transaction_hash, log_index)`.

### 2.4 Database & Cache
- **Database**: PostgreSQL (Supabase-ready).
- **ORM / Query Builder**: Drizzle ORM or native parameterized SQL.
- **Role**: Read-only replica and query cache of on-chain state. The database serves instant client dashboard queries, historical graphs, and invoice metadata.

### 2.5 Frontend Web Application
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript.
- **Styling**: TailwindCSS with custom design system (dark mode, glassmorphism, responsive data cards).
- **Icons & Graphics**: Lucide React.
- **Wallet & Identity**:
  - Embedded Account Abstraction & Passkeys (WebAuthn / ERC-4337).
  - Viem / Wagmi connectors for optional external wallets (MetaMask, Coinbase Wallet, Rainbow).
- **Core Views**:
  1. **Invoice / Payment Link (`/pay/[agreementId]`)**: Fast, one-click consumer checkout for payers.
  2. **Earner Dashboard (`/dashboard`)**: Agreement creation wizard, real-time revenue splits, backer list, payment link generator.
  3. **Backer Portal (`/explore` & `/portfolio`)**: Discover open agreements, fund agreements, live ROI and cap tracker.

---

## 3. Technology Comparison & Decision Matrix

| Dimension | Chosen Solution | Alternative Considered | Rationale |
| :--- | :--- | :--- | :--- |
| **Smart Contract Tooling** | **Foundry** | Hardhat | Foundry provides sub-second compilation, native Solidity tests, fuzzing, and gas profiling. |
| **Blockchain Client** | **Viem** | Ethers.js v6 | Viem is 10x smaller, strictly type-safe with ABIs, and significantly faster for log parsing. |
| **Math Precision** | **Basis Points (BPS)** | Decimals / Floats | Prevents rounding errors and EVM overflow/underflow issues. `10,000 BPS = 100%`. |
| **Settlement Model** | **Direct Distribution** | Pull / Claim | Direct token transfer creates instant consumer delight for backer syndicates (up to 50 backers). |
