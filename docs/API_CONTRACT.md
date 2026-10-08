# BackFlow — REST API Contract & Interface Specification

> **Base URL**: `http://localhost:3001` (Dev) / `https://api.backflow.app` (Prod)  
> **Protocol**: HTTPS / JSON  
> **Data Serialization**: `BigInt` numbers formatted as strings in JSON payloads  

---

## 1. Global Endpoints

### 1.1 Health Check
- **Endpoint**: `GET /health`
- **Response `200 OK`**:
```json
{
  "status": "ok",
  "protocol": "BackFlow",
  "network": "Monad Testnet",
  "timestamp": "2026-10-08T12:00:00.000Z"
}
```

---

## 2. Agreements Resource (`/agreements`)

### 2.1 List All Agreements
- **Endpoint**: `GET /agreements`
- **Response `200 OK`**:
```json
[
  {
    "id": "BF-001",
    "chainAgreementId": "1",
    "earnerAddress": "0x1001000000000000000000000000000000001001",
    "earnerName": "Rahul (Full-Stack Freelancer)",
    "paymentToken": "0xUSDC000000000000000000000000000000000000",
    "fundingTarget": "2000000000",
    "totalFunded": "2000000000",
    "revenueShareBps": "1000",
    "capMultiplierBps": "20000",
    "totalMaximumReturn": "4000000000",
    "totalDistributed": "100000000",
    "durationSeconds": "31536000",
    "status": "ACTIVE"
  }
]
```

### 2.2 Get Agreement by ID
- **Endpoint**: `GET /agreements/:id`
- **Response `200 OK`**: Includes agreement object plus embedded `backers` array:
```json
{
  "id": "BF-001",
  "earnerName": "Rahul",
  "fundingTarget": "2000000000",
  "totalFunded": "2000000000",
  "revenueShareBps": "1000",
  "status": "ACTIVE",
  "backers": [
    {
      "id": "pos_a",
      "backerAddress": "0x2001000000000000000000000000000000002001",
      "backerName": "Aman (Backer A - 20%)",
      "fundedAmount": "400000000",
      "distributedAmount": "20000000",
      "maxCap": "800000000",
      "isCompleted": false
    }
  ]
}
```

### 2.3 Create Agreement
- **Endpoint**: `POST /agreements`
- **Request Body**:
```json
{
  "id": "BF-002",
  "earnerAddress": "0x9876543210987654321098765432109876543210",
  "earnerName": "Sarah",
  "paymentToken": "0xUSDC",
  "fundingTarget": "5000000000",
  "revenueShareBps": "1500",
  "capMultiplierBps": "20000",
  "durationSeconds": "31536000"
}
```
- **Response `201 Created`**: Returns created agreement object.
- **Response `400 Bad Request`**:
```json
{
  "errors": ["Funding target must be greater than zero", "Invalid revenue share BPS"]
}
```

### 2.4 Simulate Settlement Preview
- **Endpoint**: `POST /agreements/:id/simulate-settlement`
- **Request Body**:
```json
{
  "grossPayment": "1000000000"
}
```
- **Response `200 OK`**:
```json
{
  "grossPayment": "1000000000",
  "rawBackerPoolCut": "100000000",
  "actualTotalBackerPayout": "100000000",
  "earnerPayout": "900000000",
  "backerAllocations": [
    {
      "backerAddress": "0x2001...",
      "allocatedAmount": "20000000",
      "newDistributed": "20000000",
      "maxCap": "800000000",
      "capReached": false
    }
  ],
  "allBackersCompleted": false
}
```

---

## 3. Payments Resource (`/payments`)

### 3.1 Create Payment Intent
- **Endpoint**: `POST /payments/create-intent`
- **Request Body**:
```json
{
  "agreementId": "BF-001",
  "amount": "1000000000",
  "currency": "USDC",
  "payerAddress": "0x3001..."
}
```
- **Response `200 OK`**:
```json
{
  "sessionId": "sess_1791220000_abc123",
  "checkoutUrl": "/pay/BF-001?session=sess_1791220000_abc123&amount=1000000000",
  "amount": "1000000000",
  "currency": "USDC"
}
```

### 3.2 Execute / Record Settlement
- **Endpoint**: `POST /payments/settle`
- **Request Body**:
```json
{
  "agreementId": "BF-001",
  "grossAmount": "1000000000",
  "payerAddress": "0x3001..."
}
```
- **Response `200 OK`**:
```json
{
  "transactionHash": "0x9e8a7b6c5d4e...",
  "blockNumber": 1234567,
  "grossAmount": "1000000000",
  "backerShareTotal": "100000000",
  "earnerShare": "900000000"
}
```
