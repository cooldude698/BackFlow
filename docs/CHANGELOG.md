# Changelog

All notable changes to the **BackFlow Protocol** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-08

### Added
- **Foundry Smart Contract Protocol**:
  - `AgreementManager.sol`: Agreement registry, escrow funding, and state machine (`DRAFT` $\rightarrow$ `FUNDING` $\rightarrow$ `ACTIVE` $\rightarrow$ `COMPLETED`).
  - `SettlementEngine.sol`: Atomic pro-rata router with cap clamping and zero trapped funds guarantee.
  - `MockUSDC.sol`: 6-decimal testnet payment token.
  - Comprehensive Foundry test suite (`SettlementEngine.t.sol`) with 100% pass rate.
- **Pure Financial Engine (`@backflow/financial-engine`)**:
  - Integer basis points arithmetic matching Solidity `uint256` behavior.
  - Unit tests covering Rahul canonical test case and cap clamping.
- **Database Architecture (`database/migrations`)**:
  - `001_initial_schema.sql`: PostgreSQL / Supabase schema with strict `UNIQUE (transaction_hash, log_index)` constraint.
- **Backend API & Event Indexer (`apps/api`)**:
  - Express REST API with BigInt serialization.
  - `TestnetPaymentAdapter` and `BlockchainListener` classes.
  - Pre-seeded in-memory store for Rahul (`BF-001`).
- **Next.js 15 Web Application (`apps/web`)**:
  - Earner Dashboard (`/dashboard`) with metrics cards and backer syndicate table.
  - Consumer Payment Link (`/pay/[agreementId]`) with 1-click settlement and live breakdown.
  - Interactive Settlement Simulator (`/simulator`) with reactive cap progress bars.
  - Dark mode glassmorphic UI system.
- **End-to-End Simulation Runner**:
  - `scripts/simulate-milestone.ts` verifying the entire 5-step lifecycle.
- **Comprehensive Documentation Suite**:
  - Master rules, PRD, TRD, Architecture, Data model, Data sources, Scraping spec, API contract, UI spec, Error handling, Security, AdMob/Fee spec, GitHub Actions, Testing, Production checklist, Microtasks, Decisions, and Team Task allocations.
