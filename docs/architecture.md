# 🧩 FlowBridge Architecture

> ZK Sync–powered real-time payment network bridging traditional banking systems and blockchain settlements.

## 🏗️ System Overview

FlowBridge is designed as a modular payment infrastructure that connects smart contracts on ZK Sync with traditional financial systems through Node.js microservices and event-driven pipelines.

It replicates how fintech platforms handle real-time, compliant, tokenized payments at scale.

The system is split into three main layers:

1. On-Chain Layer (Settlement Layer) – Smart contracts for token issuance, escrow, and settlement.
2. Off-Chain Layer (Orchestration Layer) – Node.js microservices coordinating events, compliance, and reconciliation.
3. Integration Layer (Mock Banking Layer) – Simulated APIs representing legacy banking systems for ACH/Swift-like flows.

## 🧭 Architecture Diagram

```
                   ┌────────────────────────────┐
                   │         Frontend UI        │
                   │  (Next.js / Postman / CLI) │
                   └──────────────┬─────────────┘
                                  │  REST / JWT
                                  ▼
                    ┌────────────────────────────┐
                    │       API Gateway          │
                    │ - Fastify / OAuth2 / JWT   │
                    │ - Rate limiting & logging  │
                    └──────────────┬─────────────┘
                                  │ Internal REST / gRPC
                                  ▼
                    ┌────────────────────────────┐
                    │   Payment Orchestrator     │
                    │ - Listens to ZK Sync events│
                    │ - Redis/Kafka streaming    │
                    │ - Calls Bank APIs          │
                    │ - Dispatches Webhooks      │
                    └──────────────┬─────────────┘
                 ↙────────────────┘                 └────────────────↘
        ┌──────────────────────────────┐      ┌────────────────────────────┐
        │   Smart Contracts (ZK Sync)  │      │     Mock Bank API Layer    │
        │ - TokenizedCash.sol (ERC20)  │      │ - /balances /transfers     │
        │ - PaymentRouter.sol (Escrow) │      │ - /settlements endpoints   │
        │ - SettlementManager.sol      │      │ - Simulates ACH processing │
        └──────────────────────────────┘      └────────────────────────────┘
```

## ⚙️ Core Components

### 1️⃣ Smart Contract Layer (ZK Sync Settlement)

- TokenizedCash.sol – ERC-20 stablecoin representing tokenized USD (fbUSD).
- PaymentRouter.sol – Manages payments, escrows, and settlement events.
- SettlementManager.sol – Batches settlements, emits reconciliable events.
- MultiSigVault.sol – Institutional account control (role-based permissions).

Data Flow:

1. User calls initiatePayment() → emits PaymentInitiated event.
2. Backend listens and mirrors event to off-chain systems.
3. When verified, orchestrator calls settlePayment() → emits PaymentSettled.

### 2️⃣ Off-Chain Layer (Payment Orchestration)

- API Gateway – JWT/OAuth2, rate limiting, request routing.
- Payment Orchestrator – Event-driven service: listens to on-chain events, triggers reconciliation, forwards updates.
- Redis/Kafka Stream – Message bus for async processing and resilience.

### 3️⃣ Integration Layer (Mock Banking API)

- Endpoints: POST /internal/hold, POST /internal/settle, GET /accounts/:id/balance.
- Simulates ACH-style ledger with holds and settlements.

## 🔁 End-to-End Flow (Summary)

API → Router.initiate → Event → Orchestrator → Bank hold → settlePayment → Event → Webhooks → Reconciliation

## 🔒 Security & Compliance Highlights

- Auth: JWT + optional OAuth2/FAPI-ready gateway
- Rate limiting: prevent API abuse
- Audit logging: immutable event records
- Formal verification: tests + invariants via Foundry


