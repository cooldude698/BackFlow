# BackFlow Financial Mathematics & Settlement Model

## 1. Fundamentals

All monetary calculations in BackFlow operate with integer arithmetic using 256-bit unsigned integers (`uint256` in Solidity and `bigint` in TypeScript). Floating-point arithmetic is strictly prohibited.

### 1.1 Precision Definitions
- **BPS Divisor**: $D_{\text{BPS}} = 10,000$
  - $1 \text{ BPS} = 0.01\%$
  - $100 \text{ BPS} = 1.00\%$
  - $1,000 \text{ BPS} = 10.00\%$
  - $10,000 \text{ BPS} = 100.00\%$
- **Cap Multiplier**: Expressed in BPS (e.g., $20,000 \text{ BPS} = 2.0\times$ cap).

---

## 2. Mathematical Formulations

### 2.1 Individual Backer Cap
When Backer $i$ funds $F_i$ into an agreement with cap multiplier $M_{\text{BPS}}$:
$$C_i = \left\lfloor \frac{F_i \times M_{\text{BPS}}}{D_{\text{BPS}}} \right\rfloor$$

*Example*: Backer funds $\$400$ ($400 \times 10^6$ units) with $2.0\times$ cap ($20,000 \text{ BPS}$):
$$C_i = \frac{400 \times 10^6 \times 20,000}{10,000} = 800 \times 10^6 \text{ units } (\$800)$$

### 2.2 Gross Payment Split
Given a client payment of $P_{\text{gross}}$ and agreement revenue share $S_{\text{BPS}}$:
$$\text{Raw Backer Pool Cut } R_{\text{raw}} = \left\lfloor \frac{P_{\text{gross}} \times S_{\text{BPS}}}{D_{\text{BPS}}} \right\rfloor$$

### 2.3 Pro-Rata Backer Entitlement
For each backer $i \in \{1, \dots, N\}$ who funded $F_i$ out of total pool funding $F_{\text{total}}$:
$$\text{Theoretical Entitlement } E_i = \left\lfloor \frac{R_{\text{raw}} \times F_i}{F_{\text{total}}} \right\rfloor$$

### 2.4 Remaining Cap Clamping
Let $D_i$ be the cumulative distributions already received by backer $i$.
$$\text{Remaining Cap } C_i^{\text{rem}} = \begin{cases} C_i - D_i & \text{if } D_i < C_i \\ 0 & \text{otherwise} \end{cases}$$
$$\text{Actual Backer Payout } A_i = \min\left(E_i, C_i^{\text{rem}}\right)$$

### 2.5 Earner Residual Payout
$$\text{Actual Total Backer Payout } R_{\text{actual}} = \sum_{i=1}^N A_i$$
$$P_{\text{earner}} = P_{\text{gross}} - R_{\text{actual}}$$

---

## 3. Mathematical Proof: Zero Trapped Funds Invariant

### Theorem:
*For every settlement transaction, no token dust remains in the settlement contract, and the sum of all distributed tokens exactly equals the gross incoming payment.*

### Proof:
By definition of $P_{\text{earner}}$:
$$P_{\text{earner}} = P_{\text{gross}} - R_{\text{actual}}$$
Rearranging:
$$P_{\text{earner}} + R_{\text{actual}} = P_{\text{gross}}$$
Substitute $R_{\text{actual}} = \sum_{i=1}^N A_i$:
$$P_{\text{earner}} + \sum_{i=1}^N A_i = P_{\text{gross}}$$

Because the contract transfers $A_i$ directly to each backer and transfers $P_{\text{earner}}$ to the earner within the same atomic transaction:
$$\Delta \text{Balance}_{\text{contract}} = P_{\text{gross}} - \left( \sum_{i=1}^N A_i + P_{\text{earner}} \right) = 0$$
$\blacksquare$

---

## 4. Edge-Case Matrix

| Scenario | Behavior | State Effect |
| :--- | :--- | :--- |
| **Backer Hits Cap Mid-Payment** | Backer receives exactly $C_i^{\text{rem}}$. Excess theoretical entitlement cascades directly to Earner. | Backer marked `isCompleted = true`. |
| **All Backers Reached Cap** | $R_{\text{actual}} = 0$. $P_{\text{earner}} = P_{\text{gross}}$ (100% to Earner). | Agreement marked `COMPLETED`. Revenue sharing automatically shuts off. |
| **Small Payment ($1 or less)** | If $P_{\text{gross}} \times S_{\text{BPS}} < 10,000$, raw cut evaluates to 0. Earner receives $100\%$. | No backer received delta; no underflow error. |
| **Zero Funding Target** | Reverts on `createAgreement()` (`require(fundingTarget > 0)`). | Agreement cannot be created. |
| **Overfunding Attempt** | Backer attempting to fund more than remaining capacity reverts. | Only exact funding accepted. |
