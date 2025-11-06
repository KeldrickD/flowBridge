import { NextResponse } from "next/server";

export async function GET() {
  const data = {
    stats: {
      totalPayments24h: 1248,
      settlementSuccessRate: 0.992,
      failedPayments24h: 10,
      avgSettlementLatencyMs: 3200,
      p95SettlementLatencyMs: 5100,
      ledgerDiscrepancies: 2,
      ledgerDiscrepanciesOver1Usd: 0
    },
    payments: [
      {
        id: "0x3ab1…e7f",
        paymentHash: "0x3ab1e7fabc123",
        payerAddress: "0xA11C…E001",
        payeeAddress: "0xB0B0…0042",
        amount: 250.0,
        currency: "fbUSD",
        status: "settled",
        latencyMs: 3200,
        offchainRef: "ACH-REF-001",
        createdAt: "2025-11-05T15:20:12.000Z"
      },
      {
        id: "0x9c42…ab0",
        paymentHash: "0x9c42ab0aaafe",
        payerAddress: "0xC0FE…1234",
        payeeAddress: "0xD34D…5678",
        amount: 1200.0,
        currency: "fbUSD",
        status: "pending",
        latencyMs: null,
        offchainRef: "ACH-REF-002",
        createdAt: "2025-11-05T15:21:03.000Z"
      },
      {
        id: "0x7de1…99c",
        paymentHash: "0x7de199c0ffee",
        payerAddress: "0xA11C…E001",
        payeeAddress: "0xFEE1…BADD",
        amount: 75.5,
        currency: "fbUSD",
        status: "failed",
        latencyMs: 5200,
        offchainRef: "ACH-REF-003",
        createdAt: "2025-11-05T15:19:47.000Z"
      },
      {
        id: "0x4aa0…110",
        paymentHash: "0x4aa0110deadb",
        payerAddress: "0xBEEF…2048",
        payeeAddress: "0xB0B0…0042",
        amount: 980.0,
        currency: "fbUSD",
        status: "settled",
        latencyMs: 2800,
        offchainRef: "ACH-REF-004",
        createdAt: "2025-11-05T15:18:05.000Z"
      }
    ],
    services: [
      { name: "API Gateway", key: "api-gateway", status: "healthy", latencyMs: 42 },
      { name: "Payment Orchestrator", key: "payment-orchestrator", status: "healthy", latencyMs: 63 },
      { name: "zkSync Listener", key: "zksync-listener", status: "degraded", latencyMs: 120 },
      { name: "Bank Mock API", key: "bank-mock", status: "healthy", latencyMs: 55 }
    ],
    events: [
      {
        time: "2025-11-05T15:22:40.000Z",
        type: "payment.settled",
        description: "0x3ab1…e7f settled on zkSync; bank ACH-REF-001 confirmed."
      },
      {
        time: "2025-11-05T15:21:15.000Z",
        type: "reconciliation.run",
        description: "AI reconciliation completed: 0 discrepancies > $1.00 detected."
      },
      {
        time: "2025-11-05T15:20:03.000Z",
        type: "payment.failed",
        description: "0x7de1…99c reverted (insufficient on-chain escrow). Flagged for review."
      },
      {
        time: "2025-11-05T15:18:30.000Z",
        type: "webhook.dispatch",
        description: "Sent payment.settled webhook to partner finbank-001 (HTTP 200)."
      }
    ]
  };
  return NextResponse.json(data);
}


