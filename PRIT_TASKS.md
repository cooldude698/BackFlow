# Prit's Engineering Roadmap & Phase Breakdown

> **Owner**: Prit  
> **Domain**: Frontend Architecture, Consumer Payment Experience, Account Abstraction & UI Design System  
> **Order of Preference**: Phase 1 $\rightarrow$ Phase 2 $\rightarrow$ Phase 3 $\rightarrow$ Phase 4 $\rightarrow$ Phase 5  

---

## 🎨 Phase 1: Design System & Core UI Foundation (P0 — MUST DO FIRST)
*Objective*: Establish the visual identity and dark-mode aesthetic.

- [x] **Task 1.1: Design Tokens & Tailwind Theme**
  - Paths: `apps/web/tailwind.config.ts` & `apps/web/src/app/globals.css`
  - Setup dark navy background (`#05070e`, `#020408`).
  - Configure brand mint/teal glow accents (`#00F5A0`, `#14b8a6`).
  - Create reusable glassmorphic utilities (`.glass-panel`, `.glass-panel-glow`, `.glow-btn`).

- [x] **Task 1.2: Global Navigation Header**
  - Path: `apps/web/src/components/Navbar.tsx`
  - Build responsive header with BackFlow logo, Monad testnet status pill, and Passkey status indicator.

- [x] **Task 1.3: Protocol Overview Landing Page**
  - Path: `apps/web/src/app/page.tsx`
  - Implement hero section, "Single Source of Truth" card comparing traditional backend vs BackFlow contract settlement.

---

## 💳 Phase 2: Consumer Checkout Experience (`/pay/[id]`) (P0 — SECOND PRIORITY)
*Objective*: Build the world-class 1-click payment experience that makes judges and clients smile.

- [x] **Task 2.1: Payment Page Layout & Waterfall Card**
  - Path: `apps/web/src/app/pay/[id]/page.tsx`
  - Display verified invoice header (Invoice ID, Earner Name, Description).
  - Display prominent gross payment amount ($1,000.00 USDC).
  - Build smart settlement preview waterfall showing 90% Earner cut ($900) and 10% Backer Syndicate cut ($100), broken down pro-rata by backer.

- [x] **Task 2.2: 1-Click Passkey Payment Action**
  - Path: `apps/web/src/app/pay/[id]/page.tsx`
  - Build 1-click payment button with spinner transition.
  - Render instant Monad testnet confirmation card displaying transaction hash and success receipt.

---

## 📊 Phase 3: Earner Dashboard (`/dashboard`) (P1 — THIRD PRIORITY)
*Objective*: Empower Rahul to manage funding, monitor active backers, and generate payment links.

- [x] **Task 3.1: Live Metrics Cards**
  - Path: `apps/web/src/app/dashboard/page.tsx`
  - 4 cards: Upfront Funded ($2,000 / 100% met), Revenue Share Rate (10.00%), Total Distributed ($100 / $4,000 cap), Earner Net Kept ($900).

- [x] **Task 3.2: Backer Syndicate Table**
  - Path: `apps/web/src/app/dashboard/page.tsx`
  - Render table with Backer Name, Address, Capital Funded, Pool Share %, Max Cap (2×), Received to Date, Status.

- [x] **Task 3.3: Link Sharing & Copy to Clipboard**
  - Add "Copy Payment Link" action with temporary "Link Copied!" visual feedback.

---

## 🧮 Phase 4: Interactive Settlement Simulator (`/simulator`) (P1 — FOURTH PRIORITY)
*Objective*: Give judges an interactive sandbox to test payment amounts, revenue percentages, and cap behaviors.

- [x] **Task 4.1: Reactive Calculation Controls**
  - Path: `apps/web/src/app/simulator/page.tsx`
  - Numeric inputs for Gross Payment ($1,000), Revenue Share % (10%), Return Cap Multiplier (2.0×).

- [x] **Task 4.2: Visual Cap Progress & Cascading Bars**
  - Render animated progress bars for Backer A ($800 cap), Backer B ($1,200 cap), Backer C ($2,000 cap).
  - Display `CAP REACHED (0% Future)` badge when a backer hits their cap.
  - Demonstrate invariant check: Gross Payment strictly equals Earner Payout + Backers Payout.

---

## ✨ Phase 5: Passkey WebAuthn & Visual Polish (P2 — FINAL POLISH)
*Objective*: Consumer polish and deployment validation.

- [ ] **Task 5.1: Real WebAuthn Passkey Prompt**
  - Integrate `navigator.credentials.get()` for real Touch ID / Face ID browser prompts.

- [ ] **Task 5.2: Settlement Confetti Effect**
  - Add `canvas-confetti` trigger upon successful payment settlement.

- [x] **Task 5.3: Next.js Production Build Validation**
  - Run: `npx -w @backflow/web next build`. Verify zero build errors or hydration mismatches.
