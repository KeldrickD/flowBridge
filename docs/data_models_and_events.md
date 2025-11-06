# 🧾 FlowBridge Data Models & Event System

> Defining the ledgers, events, and data contracts that power real-time blockchain + banking settlements.

## Overview

Event-sourced architecture: the event stream is source of truth; databases are materialized views for querying, reconciliation, and compliance.

The Payment Orchestrator consumes events, stores normalized records in PostgreSQL, and triggers webhooks to partners.

## Database Schema (PostgreSQL)

```
┌───────────────────────────┐
│        payments           │
├───────────────────────────┤
│ id (uuid, pk)             │
│ payment_hash (text, uniq) │
│ payer_address (text)      │
│ payee_address (text)      │
│ amount_wei (numeric)      │
│ currency (text)           │
│ offchain_ref (text)       │
│ status (enum)             │
│ escrow (boolean)          │
│ tx_hash (text)            │
│ created_at (timestamptz)  │
│ updated_at (timestamptz)  │
└───────────────────────────┘
           │
           ▼
┌───────────────────────────┐
│     payment_events        │
├───────────────────────────┤
│ id (uuid, pk)             │
│ payment_id (fk)           │
│ event_type (text)         │
│ payload (jsonb)           │
│ tx_hash (text)            │
│ block_number (int)        │
│ source (text)             │
│ created_at (timestamptz)  │
└───────────────────────────┘
           │
           ▼
┌───────────────────────────┐
│        accounts           │
├───────────────────────────┤
│ id (uuid, pk)             │
│ address (text, uniq)      │
│ balance_onchain (numeric) │
│ balance_bank (numeric)    │
│ discrepancy (numeric)     │
│ updated_at (timestamptz)  │
└───────────────────────────┘
```

## Topics / Streams

| Topic | Producer | Consumer | Purpose |
| --- | --- | --- | --- |
| payments.new | API Gateway | Orchestrator | New payment requests |
| payments.onchain | zkSync Listener | Orchestrator / Bank Worker | On-chain events |
| payments.bank | Bank Mock API | Orchestrator | Off-chain banking updates |
| reconciliation.reports | AI Assistant | Monitoring | Nightly discrepancy summaries |

Partitioning: by paymentId or payerAddress for ordered processing.

## Event Schemas (examples)

PaymentInitiated

```
{
  "event": "PaymentInitiated",
  "paymentId": "0x3ab1e7f...",
  "payer": "0xA11CE...",
  "payee": "0xB0B...",
  "amount": "1000000000000000000",
  "escrow": true,
  "offchainRef": "BANKHOLD-78231",
  "blockNumber": 18577102,
  "txHash": "0x4f98...",
  "timestamp": 1730927200
}
```

PaymentSettled

```
{
  "event": "PaymentSettled",
  "paymentId": "0x3ab1e7f...",
  "payer": "0xA11CE...",
  "payee": "0xB0B...",
  "amount": "1000000000000000000",
  "blockNumber": 18577122,
  "txHash": "0x6a23...",
  "timestamp": 1730927450
}
```


