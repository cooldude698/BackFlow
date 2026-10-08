# BackFlow — Comprehensive Testing Strategy & Test Suites

## 1. Testing Pyramid & Principles

```
                   /\
                  /  \     End-to-End Milestone Simulation
                 / E2E \   (scripts/simulate-milestone.ts)
                /-------\
               / Foundry \  Smart Contract Invariant & Fuzzing
              / Contracts \ (contracts/test/SettlementEngine.t.sol)
             /-------------\
            / Pure TS Engine\ Deterministic Math & BPS Tests
           /  Unit Tests     \ (@backflow/financial-engine)
          /-------------------\
```

### Invariant Under Test
$$\Delta \text{Balance}(\text{SettlementEngine}) = 0 \quad \forall \text{ valid payments}$$
$$\sum \text{BackerPayouts} + \text{EarnerPayout} = \text{GrossPayment}$$

---

## 2. Test Suites Detailed Breakdown

### 2.1 Pure TypeScript Engine (`packages/financial-engine`)
Run with: `npm run test:engine`
- **Test 1**: Canonical Rahul Use Case ($2,000 target, 3 backers, 10% rev share, $1,000 payment $\rightarrow$ $900 earner, $100 backers).
- **Test 2**: Cap Clamping: Backer at $1,980 out of $2,000 cap receiving $1,000 payment with 10% cut receives exactly $20; remaining $80 cascades to Earner.
- **Test 3**: All Backers Completed: When all caps are satisfied, 100% of payment flows to Earner.

### 2.2 Foundry Smart Contract Suite (`contracts/test`)
Run with: `npm run test:contracts`
- **`testCanonicalRahulWorkflow()`**:
  - Rahul registers $2,000 target.
  - Backer A funds $400, B funds $600, C funds $1,000.
  - Verifies auto-activation and upfront transfer of $2,000 USDC to Rahul.
  - Client pays $1,000 USDC $\rightarrow$ Backers receive $20, $30, $50; Rahul receives $900.
  - Verifies contract token balance is strictly 0.
- **`testCapEnforcementAndTermination()`**:
  - Multi-payment sequence pushing Backer A to 2.0× cap.
  - Asserts status transition to `AgreementStatus.COMPLETED`.

### 2.3 End-to-End Milestone Simulation (`scripts/`)
Run with: `npm run test:milestone`
- Simulates the entire 5-step lifecycle across 5 syndicate backers with colored telemetry and invariant verification.

---

## 3. Testing Command Reference

```bash
# Run all tests in repository
npm test

# Run only financial engine math tests
npm run test:engine

# Run Foundry contracts with high verbosity and traces
cd contracts && forge test -vvvv

# Run gas profiling report
cd contracts && forge snapshot

# Run the 5-step milestone console simulation
npm run test:milestone
```
