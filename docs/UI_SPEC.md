# BackFlow — User Interface & Design System Specification

## 1. Visual Design Philosophy & Brand Tokens

BackFlow bridges programmable DeFi settlement with consumer-grade simplicity. The interface conveys institutional trust, cryptographic determinism, and instant feedback.

### 1.1 Color Palette
- **Background Deep**: `#05070e` (`bg-navy-900`)
- **Background Darkest**: `#020408` (`bg-navy-950`)
- **Surface Glass**: `rgba(13, 20, 36, 0.7)` with `backdrop-blur-xl`
- **Brand Primary**: `#14b8a6` (`text-brand-500` / `border-brand-500`)
- **Brand Glow Accent**: `#00F5A0` (`bg-brand-glow`, vibrant neon mint)
- **Secondary Accent**: `#8b5cf6` (Purple for Cap and Multiplier indicators)
- **Positive Status**: `#10b981` (Emerald for verified state & payments)
- **Danger Status**: `#f43f5e` (Rose for cap reached & errors)

### 1.2 Typography
- **Headings & UI**: `Inter`, `-apple-system`, sans-serif.
- **Financial & Crypto Data**: `JetBrains Mono`, monospace (used for transaction hashes, wallet addresses, and dollar amounts).

---

## 2. Screen Specifications & User Journeys

### 2.1 Consumer Checkout (`/pay/[agreementId]`)
- **Purpose**: Allow a client to pay an earner's invoice with zero blockchain confusion.
- **Key Components**:
  1. *Invoice Badge*: Shows invoice ID and verified status on Monad.
  2. *Amount Due*: Prominent headline display of amount (e.g. `$1,000.00 USDC`).
  3. *Smart Settlement Preview Waterfall*:
     - Earner cut (e.g. `$900.00 USDC` - 90%).
     - Backers syndicate cut (e.g. `$100.00 USDC` - 10%).
     - Sub-bullet expansion showing individual pro-rata backer allocations.
  4. *One-Click Action Button*:
     - Gradient button (`#00F5A0` to `#00D9F5`).
     - Triggers biometric passkey prompt (Touch ID / Face ID).
     - Transition to spinner $\rightarrow$ Instant Monad confirmation box with Tx hash.

### 2.2 Earner Dashboard (`/dashboard`)
- **Purpose**: Provide the earner full visibility into funding, payouts, and backers.
- **Key Components**:
  1. *Summary Metric Cards (4 cards)*:
     - Upfront Funded ($2,000 USDC / 100% Target Met).
     - Revenue Share Rate (10.00% until 2.0× cap).
     - Backer Distributions ($100 / $4,000 Total Cap).
     - Earner Net Revenue Kept ($900.00 USDC).
  2. *Active Backer Syndicate Table*:
     - Columns: Backer Name, Wallet Address, Funded Capital, Pool Share %, Max Cap (2×), Cumulative Received, Status (Active/Completed).
  3. *Actions Bar*:
     - Copy Payment Link button (copies `backflow.app/pay/BF-001` to clipboard).
     - Launch Settlement Simulator button.

### 2.3 Interactive Settlement Simulator (`/simulator`)
- **Purpose**: Interactive sandbox demonstrating mathematical settlement rules.
- **Interactive Controls**:
  - Payment Amount input ($1,000 slider/input).
  - Revenue Share % input (10%).
  - Return Cap Multiplier input (2.0×).
- **Reactive Output**:
  - Split cards for Earner and Total Backer Pool.
  - Progress bars for Backer A ($800 cap), Backer B ($1,200 cap), and Backer C ($2,000 cap).
  - "Simulate & Commit Settlement" button to simulate repeated payments and cap termination.

---

## 3. Accessibility Standards (WCAG 2.1 AA)

- Minimum contrast ratio of 4.5:1 for body copy against dark glass surfaces.
- All interactive controls feature visible keyboard focus rings (`focus:ring-2 focus:ring-brand-400`).
- Screen reader accessibility for animated progress bars using `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`.
