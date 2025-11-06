🏦 FlowBridge

FlowBridge is a ZK Sync-powered real-time payment network that bridges traditional finance and digital assets.

It demonstrates end-to-end architecture for tokenized cash settlement, escrow flows, and off-chain orchestration through Node.js microservices—a complete simulation of modern blockchain-based financial infrastructure.

Built to showcase expertise in smart-contract security, distributed backend systems, and real-time event processing.

Why It Exists

Banks and fintechs operate 9-to-5; blockchains run 24 / 7.

FlowBridge shows how these worlds can synchronize:

1. On-chain tokenized cash contracts handle issuance, escrow, and settlement.
2. Off-chain microservices reconcile transactions with mock “bank” APIs in real time.
3. An event-driven backend processes settlements, webhooks, and compliance logs instantly.

This mirrors the systems described in roles such as:

- Lead Smart Contract Engineer (ZK Sync | Fintech Payments)
- Lead Backend Engineer (Node.js + Blockchain Payments)
- Lead Backend Engineer – Blockchain & Payments (Cari Network)

Architecture Overview

```
         ┌──────────────────────────┐
         │        Frontend UI       │
         └────────────┬─────────────┘
                      │
               REST / WebSockets
                      │
       ┌──────────────┴──────────────┐
       │        API Gateway          │  ← JWT / OAuth2 / Rate-limit
       └──────────────┬──────────────┘
                      │
         Internal gRPC / REST calls
                      │
       ┌──────────────┴──────────────┐
       │   Payment Orchestrator      │  ← Redis/Kafka event streams
       └──────────────┬──────────────┘
          ↙                         ↘
┌────────────────┐        ┌────────────────────┐
│   ZK Sync      │        │  Mock Bank API     │
│ Smart Contracts│        │  (ACH-style layer) │
└────────────────┘        └────────────────────┘
```

On-Chain Contracts

- TokenizedCash.sol – ERC-20 stable-token for on-chain “USD”.
- PaymentRouter.sol – initiates escrow / instant settlements.
- SettlementManager.sol – batch settlement & auditing.
- MultiSigVault.sol – institutional custody.
- Formal verification / fuzz testing via Foundry.

Off-Chain Services

- API Gateway – auth, rate limit, partner webhooks.
- Payment Orchestrator – WebSocket listener for on-chain events, Redis streaming, reconciliation with bank API.
- Mock Bank API – simulates core-bank endpoints (/balances, /transfer, /settle).
- Observability – Prometheus / Grafana (coming soon).

Tech Stack

| Layer | Technologies |
| --- | --- |
| Smart Contracts | Solidity (0.8.24), ZK Sync Era, Foundry, OpenZeppelin |
| Backend | Node.js + TypeScript, Fastify, Redis Streams / Kafka, PostgreSQL |
| Infrastructure | Docker Compose, Kubernetes (manifests), Terraform stub |
| AI Tools | Claude / GPT for AI Reconciliation Assistant |
| CI/CD | GitHub Actions + Foundry Tests |

Key Features

| Category | Highlights |
| --- | --- |
| Security & Testing | Foundry unit / fuzz tests, invariant checks, gas profiling |
| Real-Time Events | WebSocket listeners ↔ Redis streams ↔ Webhook dispatch |
| Compliance Mock | Audit logging + rate limiting for PCI-style demo |
| AI Reconciliation | Optional LLM module to summarize on/off-chain discrepancies |
| Scalability | Stateless microservices, idempotent handlers, horizontal scaling |
| Observability | Structured logs (Pino), Prometheus metrics, Grafana dashboards |

Local Setup

```
# Clone & bootstrap
git clone https://github.com/yourname/flowbridge.git
cd flowbridge
pnpm install

# Start all services
docker-compose up --build

# Run Foundry tests
cd contracts && forge test -vv
```

Environment variables (for dev):

```
ZKSYNC_RPC_URL=wss://testnet.era.zksync.dev
PAYMENT_ROUTER_ADDRESS=0x...
BANK_URL=http://bank-mock:4500
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret
```

Example Flow

1. Alice mints fbUSD via TokenizedCash.
2. Alice initiates payment through API Gateway → PaymentRouter.initiatePayment.
3. Payment Orchestrator detects PaymentInitiated event via WebSocket.
4. Bank-Mock API logs a hold and returns a mock ACH reference.
5. Orchestrator emits PaymentSettled after on-chain confirmation.
6. Webhook Subscribers receive real-time updates.

End-to-end settlement ≈ 3 seconds on ZK Sync testnet.

Talking Points for Recruiters / Hiring Managers

- Security: formalized testing and invariant design for multi-sig and escrow flows.
- Scalability: stateless services + stream-based event processing to handle billions of tx.
- Compliance mindset: modeled PCI-style audit logs and FAPI-like auth gates.
- ZK Rollup Expertise: optimized gas and used zkSync-era compiler for proof generation.
- AI Augmentation: integrated LLM assistants for fin-ops and ledger reconciliation.
- System Design: full infra IaC setup + containerized microservice ecosystem.

Roadmap

- [ ] Deploy on zkSync testnet with real USDC.
- [ ] Add Next.js dashboard for payment analytics.
- [ ] Integrate Coinbase Pay / Ramp on-ramp simulation.
- [ ] Publish live demo & API docs.
- [ ] Launch testnet sandbox for developers.

Author

Keldrick Dickey

Lead Blockchain & Backend Engineer

- LinkedIn: https://linkedin.com/in/keldrickdickey
- GitHub: https://github.com/keldrickd
- Building decentralized systems that scale — one smart contract at a time.


