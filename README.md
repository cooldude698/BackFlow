# BackFlow 🌊

> **Raise upfront funding. Automatically share future revenue on-chain. Zero manual bookkeeping.**

BackFlow allows freelancers, creators, indie builders, and early-stage startups to raise upfront capital from backers and automatically stream a pre-defined percentage of eligible future revenue to those backers until an agreed return multiplier (cap) or duration is reached.

---

## ⚡ The Architectural Invariant

> **The smart contract is the single source of truth for financial settlement.**

Your backend **never** calculates or decides how much money a backer or earner is entitled to receive.

```
❌ WRONG:
Payment received -> Backend calculates "$100 to backer" -> Backend sends tokens

✅ BACKFLOW WAY:
Client Payment enters SettlementEngine
          ↓
Smart Contract queries AgreementManager terms & remaining caps
          ↓
Smart Contract calculates exact pro-rata allocations in basis points (BPS)
          ↓
Smart Contract atomically settles tokens to Backers and Earner
          ↓
Backend / Indexer strictly reads and mirrors what happened
```

---

## 👥 The Three Primary Users

| Role | Who They Are | What They Do |
| :--- | :--- | :--- |
| **Earner** | Freelancer, Creator, Dev, Startup Founder | Creates an agreement with a funding target ($2,000), revenue share (10%), cap (2×), and duration (12 mo). |
| **Backer** | Friend, Family, Angel, Community Supporter | Deposits upfront capital. Receives an on-chain position entitling them to pro-rata payouts until capped. |
| **Client / Payer** | Client paying an invoice or customer buying a service | Opens a standard BackFlow payment link (`backflow.app/pay/BF-001`), signs, and pays without Web3 friction. |

---

## 💡 Revenue Share vs. Equity

BackFlow enforces **Revenue-Sharing Agreements (RSAs)**:
- **No Dilution / No Equity**: Backers do not receive equity shares or voting governance in the earner's company.
- **Strictly Capped Return**: When a backer hits their cap (e.g. 2× their funded amount), their share drops to 0% and their position is marked complete.
- **Pay-as-you-earn**: Distributions occur strictly when revenue arrives. No fixed debt payments or interest compounding.

---

## 🏛️ System Architecture

```
                                  BACKFLOW
                                     │
                     ┌───────────────┼───────────────┐
                     ▼               ▼               ▼
                 Frontend         Backend        Blockchain
                     │               │               │
                 Next.js 15       Node.js        Solidity 0.8.24
                 React 19        TypeScript         Foundry
                TailwindCSS      PostgreSQL      Monad Testnet
                     │          (Supabase)      OpenZeppelin v5
                     │               │               │
                     └───────────────┼───────────────┘
                                     │
                             Settlement Rail
                                     │
                                     ▼
                            On-Chain Settlement
```

### Smart Contract Decoupling
1. **`AgreementManager.sol`**:
   - Manages agreement lifecycle (`DRAFT` → `FUNDING` → `ACTIVE` → `COMPLETED` / `EXPIRED`).
   - Registers backers and holds individual positions (`fundedAmount`, `distributedAmount`, `maxCap`).
   - Enforces immutability of terms once `ACTIVE`.
2. **`SettlementEngine.sol`**:
   - Accepts ERC-20 payments for an agreement.
   - Calculates pro-rata shares with zero floating-point arithmetic using basis points (`100 BPS = 1%`).
   - Clamps payouts to individual remaining caps (`min(entitlement, maxCap - distributed)`).
   - Atomically transfers backer portions and routes the remainder to the earner.
   - Any excess revenue from capped backers automatically cascades to the earner.

---

## 📂 Repository Structure

```
backflow/
├── apps/
│   ├── web/                    # Next.js frontend (consumer pay link, earner & backer dashboards)
│   └── api/                    # Node.js / Fastify backend API & blockchain event indexer
│
├── contracts/                  # Foundry smart contract workspace
│   ├── src/
│   │   ├── AgreementManager.sol
│   │   ├── SettlementEngine.sol
│   │   ├── MockUSDC.sol
│   │   └── interfaces/
│   │       ├── IAgreementManager.sol
│   │       └── ISettlementEngine.sol
│   ├── test/                   # Comprehensive Foundry test suites
│   │   ├── AgreementManager.t.sol
│   │   ├── SettlementEngine.t.sol
│   │   └── EndToEndFlow.t.sol
│   ├── script/
│   │   └── Deploy.s.sol
│   └── foundry.toml
│
├── packages/
│   ├── financial-engine/       # Pure TypeScript deterministic financial calculation engine
│   ├── types/                  # Shared TypeScript interfaces & state definitions
│   └── validation/             # Shared validation schemas
│
├── database/
│   └── migrations/
│       └── 001_initial_schema.sql  # Supabase / PostgreSQL schema
│
├── docs/
│   ├── architecture.md         # Comprehensive system architecture & diagrams
│   ├── technology-stack.md     # In-depth technology rationale & stack breakdown
│   ├── contract-spec.md        # Smart contract specification, BPS math, state machine
│   ├── payment-flow.md         # Client payment sequence, gasless/relayer flow
│   ├── financial-model.md      # Financial mathematics, pro-rata formulas & cap proofs
│   └── security.md             # Security threat matrix, CEI, invariants & audit checklist
│
├── package.json
└── README.md
```

---

## 🔢 The Canonical Milestone Test Case

### Parameters:
- **Earner**: Rahul
- **Funding Target**: $2,000 USDC
- **Revenue Share**: 10% (1,000 BPS)
- **Cap Multiplier**: 2.0× (20,000 BPS) -> Maximum total backer payout = $4,000
- **Duration**: 12 Months

### 1. Backer Syndicate:
- **Backer A**: $400 (20% of pool) -> Cap: $800
- **Backer B**: $600 (30% of pool) -> Cap: $1,200
- **Backer C**: $1,000 (50% of pool) -> Cap: $2,000
- **Total Funded**: $2,000 (Agreement transitions to `ACTIVE`)

### 2. Client Payment 1: $1,000 USDC
- **Revenue Share Cut (10%)**: $100
- **Backer A (20%)**: Receives $20 (Remaining cap: $780)
- **Backer B (30%)**: Receives $30 (Remaining cap: $1,170)
- **Backer C (50%)**: Receives $50 (Remaining cap: $1,950)
- **Rahul (Earner)**: Receives $900 ($1,000 - $100)

### 3. Cap Enforced & Termination:
When Backer A reaches $800 total received, Backer A's subsequent entitlement drops to $0. Subsequent payments allocate only to remaining active backers; once all caps are satisfied, 100% of future payments flow to Rahul and the agreement automatically completes!

---

## 🚀 Quickstart & Development

### 1. Prerequisites
- **Node.js**: v20+
- **Foundry**: `forge`, `cast`, `anvil`

### 2. Run Financial Engine Tests (Pure TypeScript)
```bash
npm install
npm run test:engine
```

### 3. Run Smart Contract Tests (Foundry)
```bash
cd contracts
forge test -vvv
```

### 4. Run End-to-End Local Flow
```bash
# Start local chain, deploy contracts, run e2e simulation
npm run test:e2e
```

---

## 🔒 Security & Invariants

1. **Zero Trapped Funds**: Every token entering `SettlementEngine` is immediately distributed:
   $$\text{Gross Payment} = \sum \text{Backer Distributions} + \text{Earner Distribution}$$
2. **Strict Cap Clamping**: No backer can receive more than `fundedAmount * capMultiplier`.
3. **Reentrancy Protection**: OpenZeppelin `ReentrancyGuard` on all state-modifying functions with Checks-Effects-Interactions (CEI).
4. **Immutable Terms**: Financial parameters cannot be altered by anyone (including protocol owner) once an agreement is `ACTIVE`.
