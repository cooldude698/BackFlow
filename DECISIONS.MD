# BackFlow — Architecture Decision Records (ADR)

## ADR-001: Separation of `AgreementManager` and `SettlementEngine`
- **Status**: ACCEPTED
- **Context**: Combining agreement lifecycle, backer escrow, and settlement calculations into a single contract results in bytecode bloat and large attack surfaces.
- **Decision**: Decouple state management (`AgreementManager.sol`) from execution routing (`SettlementEngine.sol`).
- **Consequences**: Cleaner testing boundaries, upgradeable settlement routing without migrating agreement state.

---

## ADR-002: Smart Contract as the Single Source of Financial Truth
- **Status**: ACCEPTED
- **Context**: Traditional fintech architectures calculate entitlements in backend microservices, introducing single points of failure and custody liabilities.
- **Decision**: The backend never computes or commands financial entitlements. All calculations are executed deterministically on-chain; the backend strictly indexes what happened.
- **Consequences**: Complete trustlessness, zero custodial risk for the protocol.

---

## ADR-003: Pure Basis Points (BPS) Math & Prohibition of Floats
- **Status**: ACCEPTED
- **Context**: Floating-point percentages create rounding drift and precision vulnerabilities on EVM blockchains.
- **Decision**: Standardize all percentage calculations using integer basis points ($10,000 \text{ BPS} = 100\%$).
- **Consequences**: Exact zero-dust mathematical determinism across Solidity and TypeScript.

---

## ADR-004: Direct Distribution Model for MVP
- **Status**: ACCEPTED
- **Context**: In high-scale protocols with 10,000 backers, batch loops cause gas exhaustion. However, pull/claim models require backers to pay gas to claim micro-earnings.
- **Decision**: Use direct distribution for agreements with up to 50 backers on Monad testnet, giving an immediate "magic" user experience for hackathon demos.
- **Consequences**: Backers see instant balance updates with zero friction.

---

## ADR-005: Target Settlement on Monad Testnet
- **Status**: ACCEPTED
- **Context**: Ethereum L1 and congested L2s impose latency and gas barriers incompatible with consumer checkout links.
- **Decision**: Deploy on Monad Testnet leveraging 10,000 TPS, 1-second finality, and ultra-low transaction costs.
- **Consequences**: Sub-second payment confirmation matching consumer Web2 checkout expectations.

---

## ADR-006: Foundry Toolchain Over Hardhat
- **Status**: ACCEPTED
- **Decision**: Adopt Foundry (`forge`, `cast`, `anvil`) for sub-second test execution, native Solidity testing, and built-in fuzzing.

---

## ADR-007: Viem Over Ethers.js
- **Status**: ACCEPTED
- **Decision**: Adopt `viem` for lightweight, tree-shakeable, type-safe EVM log parsing and client connections.

---

## ADR-008: Passkeys & Account Abstraction for Payers
- **Status**: ACCEPTED
- **Decision**: Implement Passkey (WebAuthn) biometric signing to eliminate seed phrases and gas prompts for clients paying invoices.

---

## ADR-009: Pluggable Payment Adapter Interface
- **Status**: ACCEPTED
- **Decision**: Define `IPaymentAdapter` to decouple the core settlement engine from specific payment rails, paving the way for future Stripe / fiat integrations.

---

## ADR-010: Idempotent Event Ingestion via `(tx_hash, log_index)`
- **Status**: ACCEPTED
- **Decision**: Enforce compound unique index on transaction hash and log index in database to ensure zero duplicate accounting even during RPC reconnection replays.
