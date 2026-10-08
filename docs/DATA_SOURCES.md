# BackFlow — Data Sources & Infrastructure Reference

## 1. Blockchain RPC Endpoints

| Network | Role | RPC URL | Chain ID | Explorer |
| :--- | :--- | :--- | :--- | :--- |
| **Monad Testnet** | Production Demo | `https://testnet-rpc.monad.xyz` | `10143` | `https://testnet.monadexplorer.com` |
| **Local Anvil** | Development/CI | `http://127.0.0.1:8545` | `31337` | Local CLI logs |

---

## 2. Token & Contract Data Sources

### 2.1 Supported Stablecoin
- **Symbol**: `USDC` (Mock USD Coin for Hackathon)
- **Decimals**: `6`
- **Atomic Unit Factor**: `1,000,000` (i.e. $1.00 = 1,000,000 units)
- **Contract Source**: `contracts/src/MockUSDC.sol`

### 2.2 Core Protocol Contracts
- **`AgreementManager`**: Tracks agreement state and backer capital.
- **`SettlementEngine`**: Routes incoming token transfers and calculates pro-rata allocations.

---

## 3. Off-Chain Data Sources & Databases

1. **PostgreSQL / Supabase**:
   - Primary database for fast dashboard caching, invoice metadata, and indexing storage.
   - Connection string format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/backflow`.
2. **Local Memory Seed Store**:
   - `apps/api/src/services/agreementService.ts` maintains an in-memory replica pre-seeded with Rahul's canonical test agreement (`BF-001`) for immediate zero-config local demos.

---

## 4. Indexer Poll Cadence & Limits

- **Polling Interval**: 2,000 ms (2 seconds).
- **Batch Block Query Size**: 1,000 blocks per request (`eth_getLogs`).
- **Retry Policy**: Exponential backoff with 3 retries on RPC timeouts (`429` / `504`).
