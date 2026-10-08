# BackFlow — Data Model & Schema Specification

## 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ AGREEMENTS : "creates as earner"
    USERS ||--o{ BACKERS : "funds as backer"
    AGREEMENTS ||--|{ BACKERS : "contains"
    AGREEMENTS ||--o{ INVOICES : "issues"
    AGREEMENTS ||--o{ PAYMENTS : "receives"
    PAYMENTS ||--|{ SETTLEMENTS : "distributes into"
    USERS ||--o{ SETTLEMENTS : "receives payout"

    USERS {
        uuid id PK
        varchar wallet_address UK
        varchar name
        varchar email UK
        varchar role
        text passkey_credential_id
        timestamp created_at
    }

    AGREEMENTS {
        uuid id PK
        bigint chain_agreement_id UK
        uuid earner_id FK
        varchar earner_address
        varchar payment_token
        numeric funding_target
        numeric total_funded
        int revenue_share_bps
        int cap_multiplier_bps
        numeric total_maximum_return
        numeric total_distributed
        bigint duration_seconds
        varchar status
        varchar contract_address
        timestamp start_time
        timestamp created_at
    }

    BACKERS {
        uuid id PK
        uuid agreement_id FK
        uuid user_id FK
        varchar wallet_address
        numeric funded_amount
        numeric distributed_amount
        numeric max_cap
        boolean is_completed
        timestamp created_at
    }

    PAYMENTS {
        uuid id PK
        uuid agreement_id FK
        varchar payer_address
        numeric amount
        varchar currency
        varchar transaction_hash UK
        varchar status
        bigint block_number
        timestamp created_at
    }

    SETTLEMENTS {
        uuid id PK
        uuid payment_id FK
        uuid agreement_id FK
        varchar recipient_address
        varchar recipient_type
        numeric amount
        varchar transaction_hash
        int log_index
        timestamp created_at
    }

    INVOICES {
        uuid id PK
        varchar invoice_number UK
        uuid agreement_id FK
        varchar earner_address
        varchar client_name
        varchar client_email
        numeric amount
        varchar currency
        text description
        varchar payment_url
        varchar status
        timestamp due_date
        timestamp paid_at
        timestamp created_at
    }
```

---

## 2. On-Chain Solidity Data Structures

```solidity
enum AgreementStatus {
    DRAFT,
    FUNDING,
    ACTIVE,
    PAUSED,
    COMPLETED,
    EXPIRED,
    CANCELLED
}

struct Agreement {
    uint256 id;
    address earner;
    address paymentToken;
    uint256 fundingTarget;
    uint256 totalFunded;
    uint256 revenueShareBps;
    uint256 capMultiplierBps;
    uint256 totalMaximumReturn;
    uint256 totalDistributed;
    uint256 duration;
    uint256 startTime;
    AgreementStatus status;
}

struct BackerPosition {
    uint256 fundedAmount;
    uint256 distributedAmount;
    uint256 maxCap;
    bool isCompleted;
}
```

---

## 3. Storage Invariants & Precision Rules

1. **Monetary Units**:
   - Stored in atomic token decimals (`10^6` for USDC). Stored as `NUMERIC(38, 0)` in SQL to prevent any integer overflow or floating point truncation.
2. **Idempotency Compound Key**:
   - `UNIQUE (transaction_hash, log_index)` in `settlements`.
3. **Backer Uniqueness**:
   - `UNIQUE (agreement_id, wallet_address)` in `backers`.
