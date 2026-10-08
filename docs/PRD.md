# BackFlow — Product Requirements Document (PRD)

> **Document Version**: 1.0  
> **Status**: APPROVED  
> **Lead Stakeholders**: Aman & Prit  
> **Target Release**: Monad Testnet MVP  

---

## 1. Executive Summary

BackFlow is a decentralized, contract-enforced revenue-sharing protocol. It enables earners (freelancers, creators, dev shops, indie founders) to raise upfront capital from a syndicate of backers and automatically stream a pre-defined percentage of future revenue to those backers until an agreed return multiplier (cap) or time limit is reached.

---

## 2. Problem Statement

1. **For Earners**:
   - Traditional loans incur rigid monthly interest payments regardless of revenue.
   - Venture capital or angel equity dilutes ownership and creates governance burdens.
   - Existing revenue-based financing (RBF) involves opaque spreadsheets, manual reporting, and audit friction.
2. **For Backers**:
   - Backing friends or indie creators relies on informal trust with no automated collection mechanism.
   - No liquid, verifiable on-chain tracking of revenue entitlements or returns.
3. **For Clients / Payers**:
   - Web3 payment gateways frequently fail due to wallet connection hurdles, network switching, and gas complexity.

---

## 3. The BackFlow Solution

- **Upfront Capital Escrow**: Backers pool capital into a single agreement. When the target is reached, funds are transferred upfront to the earner.
- **Automated Settlement Router**: When a client pays an invoice, `SettlementEngine.sol` intercepts the payment and atomically distributes the revenue share pro-rata to backers and forwards the net remainder to the earner.
- **Finite Return Cap**: Backer entitlement strictly terminates when their return cap (e.g. 2×) is met. Excess revenue cascades immediately to the earner.
- **Consumer Payment Rail**: Clients pay via a clean, branded payment link (`backflow.app/pay/[agreementId]`) using Passkeys or 1-click approvals without Web3 friction.

---

## 4. User Personas

| Persona | Role | Primary Goal | Key Pain Point |
| :--- | :--- | :--- | :--- |
| **Rahul** | Earner (Freelance Dev) | Raise $2,000 for equipment and runway; share 10% of invoices until $4,000 paid. | Hates fixed debt; wants backers aligned with success. |
| **Aman** | Backer (Community Supporter) | Provide $400 upfront to support Rahul; earn 2.0× return ($800) transparently. | Tired of manual payouts and lack of accounting visibility. |
| **Payer/Client** | Corporate Client / Customer | Settle a $1,000 milestone invoice cleanly with a receipt. | Refuses to manage seed phrases or switch EVM networks. |

---

## 5. Functional Requirements

### 5.1 Agreement Creation & Management (Earner)
- **FR-1.1**: Earner can create an agreement specifying:
  - `fundingTarget` (in token units, e.g., $2,000 USDC)
  - `revenueShareBps` (100 to 10,000 basis points; e.g. 1000 = 10%)
  - `capMultiplierBps` ($\ge$ 10,000 basis points; e.g. 20000 = 2.0×)
  - `duration` (in days/months; e.g. 365 days)
  - `paymentToken` (ERC-20 token address on Monad)
- **FR-1.2**: State begins in `FUNDING`.
- **FR-1.3**: Once funded, state shifts to `ACTIVE` and upfront capital is released to the earner.

### 5.2 Syndicate Funding (Backers)
- **FR-2.1**: Multiple backers can fund an agreement in `FUNDING` state.
- **FR-2.2**: Maximum capital accepted is strictly clamped to `fundingTarget - totalFunded`.
- **FR-2.3**: Each backer's maximum return cap is calculated as:
  $$\text{maxCap} = \frac{\text{fundedAmount} \times \text{capMultiplierBps}}{10000}$$

### 5.3 Invoice & Payment Link Generation
- **FR-3.1**: Earner can generate public payment links (`/pay/[agreementId]`) and custom invoice links with line-item descriptions and amounts.
- **FR-3.2**: Links render verified agreement terms, earner identity, and real-time settlement breakdown.

### 5.4 Automated Smart Contract Settlement
- **FR-4.1**: `SettlementEngine.sol` accepts ERC-20 payment from client.
- **FR-4.2**: Calculates raw backer cut = $(\text{grossPayment} \times \text{revenueShareBps}) / 10000$.
- **FR-4.3**: Distributes pro-rata to all active backers:
  $$\text{share} = \frac{\text{rawBackerCut} \times \text{fundedAmount}}{\text{totalFunded}}$$
- **FR-4.4**: Clamps each backer payout to $\min(\text{share}, \text{maxCap} - \text{distributedAmount})$.
- **FR-4.5**: Immediately transfers backer payouts to backer addresses.
- **FR-4.6**: Immediately transfers remainder ($\text{grossPayment} - \text{actualTotalBackerPayout}$) to earner address.
- **FR-4.7**: If all backers reach cap, agreement automatically transitions to `COMPLETED`.

### 5.5 Observability & Dashboards
- **FR-5.1**: Earner Dashboard displays total funded, total distributed, remaining caps, backer syndicate list, and invoice links.
- **FR-5.2**: Interactive Settlement Simulator lets any user test theoretical payment splits and cap behaviors.

---

## 6. Non-Functional Requirements

- **Performance**: Settlement execution finality on Monad testnet $< 2$ seconds.
- **Reliability**: Contract functions operate deterministically with zero trapped funds invariant.
- **Security**: Strict CEI adherence, OpenZeppelin `SafeERC20`, `ReentrancyGuard`, zero admin tampering of active terms.
- **Usability**: Mobile-first responsive checkout with passkey authentication.

---

## 7. Out of Scope for MVP

- Secondary market tokenization of backer positions.
- Multi-token liquidity swaps (prototype strictly supports supported testnet stablecoin).
- Complex fiat banking API integrations (handled via payment adapter abstraction).
