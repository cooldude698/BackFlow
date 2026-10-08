# BackFlow — Error Handling & Revert Taxonomy Specification

## 1. Error Taxonomy Overview

BackFlow segments errors across three distinct runtime boundaries:
1. **On-Chain EVM Reverts** (`contracts/`)
2. **Backend API & Indexer Exceptions** (`apps/api/`)
3. **Frontend Client & RPC Errors** (`apps/web/`)

---

## 2. On-Chain Smart Contract Reverts

| Revert String / Error | Trigger Condition | Mitigation / User Action |
| :--- | :--- | :--- |
| `"Exceeds funding target"` | Backer deposits amount greater than `fundingTarget - totalFunded` | Backer must reduce funding amount to match remaining target capacity. |
| `"Agreement not in FUNDING state"` | Attempting to fund an agreement that is already `ACTIVE`, `PAUSED`, or `COMPLETED` | Display status badge in UI; disable funding button when status $\ne$ `FUNDING`. |
| `"Agreement is not ACTIVE"` | Client attempts payment into agreement that is paused, expired, or completed | Redirect payer or alert earner to resume/activate agreement. |
| `"Agreement duration expired"` | Current `block.timestamp > startTime + duration` | Agreement closed; earner must settle outside or create new agreement. |
| `"Only SettlementEngine can call"` | Direct invocation of `recordSettlementDistribution` by external wallet | Caller must route payment through `SettlementEngine.settlePayment()`. |
| `"ERC20: insufficient allowance"` | Payer has not approved `SettlementEngine` for payment tokens | Prompt 1-click permit/approval transaction before payment call. |

---

## 3. Backend API Error Formats

All API error responses adhere to RFC 7807 standard:

```json
{
  "type": "https://errors.backflow.app/INVALID_AGREEMENT_PARAM",
  "title": "Bad Request",
  "status": 400,
  "detail": "Revenue share cannot exceed 10,000 BPS (100%)",
  "instance": "/agreements",
  "timestamp": "2026-10-08T12:00:00.000Z"
}
```

### Standard Status Codes
- `400 Bad Request`: Parameter validation failures (invalid Ethereum address, negative amounts, BPS > 10,000).
- `404 Not Found`: Agreement or invoice does not exist in store or blockchain.
- `409 Conflict`: Duplicate transaction hash already processed by indexer (silent ignore).
- `429 Too Many Requests`: Rate limiter exceeded (more than 60 requests/minute per IP).
- `500 Internal Server Error`: Unhandled database or RPC timeout exception.

---

## 4. Client-Side Error Boundaries & Resilience

1. **RPC Failover Policy**:
   - If Monad primary RPC fails with timeout (`ETIMEDOUT` or `HTTP 504`), client switches automatically to secondary backup RPC endpoint.
2. **User Rejection Graceful Handling**:
   - If user dismisses passkey prompt or MetaMask modal (`code: 4001`), UI displays non-intrusive banner: *"Payment cancelled by user. No tokens were transferred."*
3. **Zero Trapped Funds Recovery**:
   - All transactions are atomic. If any token transfer fails within the settlement loop, the entire transaction reverts, ensuring no funds are stuck midway.
