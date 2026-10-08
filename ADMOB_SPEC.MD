# BackFlow — Monetization, Platform Fee & AdMob Specification

## 1. Executive Summary & Revenue Model

BackFlow incorporates a sustainable dual-monetization architecture:
1. **Protocol Take-Rate Fee**: 0.5% platform fee deducted upon successful settlement.
2. **Mobile / PWA Sponsorship & AdMob Integration**: Non-intrusive rewarded ads and discovery sponsorship for earners seeking accelerated community funding.

---

## 2. AdMob Mobile & Web Ad Unit Placements

### 2.1 Ad Placement Hierarchy
| Placement ID | Ad Format | Trigger Location | Purpose |
| :--- | :--- | :--- | :--- |
| `ad_rewarded_gas_01` | Rewarded Video | Checkout / Payment Link | User watches a 15-second sponsor ad to receive **100% gas-free sponsored transaction**. |
| `ad_native_explore_02` | Native Banner | Agreement Explorer (`/explore`) | Promotes featured creator agreements and partner Web3 fintech tooling. |
| `ad_interstitial_inv_03` | Interstitial | After invoice generation | Displays after earner creates a new agreement or exports invoice PDF. |

### 2.2 Google Mobile Ads (AdMob) Test IDs
- **Test App ID (iOS)**: `ca-app-pub-3940256099942544~1458002511`
- **Test App ID (Android)**: `ca-app-pub-3940256099942544~3347511713`
- **Rewarded Video Test Unit**: `ca-app-pub-3940256099942544/5224354917`
- **Native Banner Test Unit**: `ca-app-pub-3940256099942544/2247696110`

---

## 3. Protocol Fee Take-Rate Mechanics

When a payment of $P$ settles through `SettlementEngine`:
- Optional Platform Fee $F_{\text{platform}} = \frac{P \times \text{feeBps}}{10000}$ (default: 50 BPS = 0.5%).
- $F_{\text{platform}}$ is sent to protocol treasury address.
- Remaining $P_{\text{net}} = P - F_{\text{platform}}$ is split between Backers and Earner.
- *For the Monad Hackathon MVP: Fee is toggled to 0 BPS (0%) to maximize judge appeal and consumer adoption.*

---

## 4. Privacy & Compliance (GDPR / ATT)

- **Consent Management Platform (CMP)**: Enforces Google User Messaging Platform (UMP) SDK consent for EU/UK users.
- **Zero Ads in Settlement Flow**: Payment checkout view remains 100% ad-free by default to prevent checkout drop-off, unless user explicitly opts into the Rewarded Gas Ad.
