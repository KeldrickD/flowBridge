import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import { query } from "./lib/db";

async function getStatsSummary() {
  return {
    totalPayments24h: 1248,
    settlementSuccessRate: 0.992,
    failedPayments24h: 10,
    avgSettlementLatencyMs: 3200,
    p95SettlementLatencyMs: 5100,
    ledgerDiscrepancies: 2,
    ledgerDiscrepanciesOver1Usd: 0
  };
}

async function getServiceStatuses() {
  return [
    { name: "API Gateway", key: "api-gateway", status: "healthy", latencyMs: 42 },
    { name: "Payment Orchestrator", key: "payment-orchestrator", status: "healthy", latencyMs: 63 },
    { name: "zkSync Listener", key: "zksync-listener", status: "degraded", latencyMs: 120 }
  ];
}

export async function createHttpServer() {
  const app = Fastify({ logger: true });

  app.get("/internal/dashboard/summary", async () => {
    const [stats, services] = await Promise.all([
      getStatsSummary(),
      getServiceStatuses()
    ]);
    return { stats, services };
  });

  app.get("/internal/dashboard/payments", async (request: FastifyRequest) => {
    const q: any = request.query || {};
    const limit = Math.min(Number(q.limit) || 20, 100);
    const status = q.status as "settled" | "pending" | "failed" | undefined;

    const params: any[] = [];
    let where = "";
    if (status) {
      params.push(status);
      where = `WHERE status = $${params.length}`;
    }
    params.push(limit);

    const sql = `
      SELECT
        id,
        payment_hash,
        payer_address,
        payee_address,
        amount_wei,
        currency,
        status,
        latency_ms,
        offchain_ref,
        created_at,
        tx_hash,
        chain_id
      FROM payments
      ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length}
    `;
    const { rows } = await query(sql, params);
    const items = rows.map((row: any) => ({
      id: row.payment_hash || row.id,
      paymentHash: row.payment_hash,
      payerAddress: row.payer_address,
      payeeAddress: row.payee_address,
      amount: Number(row.amount_wei),
      currency: row.currency || "fbUSD",
      status: row.status as "settled" | "pending" | "failed",
      latencyMs: row.latency_ms !== null ? Number(row.latency_ms) : null,
      offchainRef: row.offchain_ref,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      txHash: row.tx_hash,
      chainId: row.chain_id
    }));

    return { items, pagination: { limit, nextCursor: null } };
  });

  app.get("/internal/dashboard/events", async (request: FastifyRequest) => {
    const q: any = request.query || {};
    const limit = Math.min(Number(q.limit) || 20, 100);

    const { rows } = await query(
      `SELECT id, event_type, payload, source, created_at
       FROM payment_events
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    const items = rows.map((row: any) => {
      let description = "";
      const p = row.payload || {};
      try {
        if (row.event_type === "PaymentInitiated") {
          description = `Payment ${p.paymentId ?? ""} initiated by ${p.payer ?? "?"} → ${p.payee ?? "?"} for ${
            p.amount ?? "?"
          }.`;
        } else if (row.event_type === "PaymentSettled") {
          description = `Payment ${p.paymentId ?? ""} settled on-chain.`;
        } else if (row.event_type === "PaymentFailed") {
          description = `Payment ${p.paymentId ?? ""} failed: ${p.reason ?? "unknown"}.`;
        } else {
          description = p.description || row.event_type;
        }
      } catch {
        description = row.event_type;
      }

      return {
        id: row.id,
        time: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
        type: row.event_type,
        description,
        source: row.source
      };
    });

    return { items };
  });

  app.get("/internal/dashboard/health", async () => {
    return {
      status: "healthy",
      services: await getServiceStatuses()
    };
  });

  app.get("/internal/dashboard/reconciliation", async (request: FastifyRequest, reply: FastifyReply) => {
    const q: any = request.query || {};
    const limit = Math.min(Number(q.limit) || 10, 100);

    const { rows } = await query<{
      id: string;
      run_id: string;
      total_tx: number;
      mismatched_tx: number;
      total_discrepancy_usd: string;
      ai_summary: string | null;
      created_at: Date;
    }>(
      `
      SELECT
        id,
        run_id,
        total_tx,
        mismatched_tx,
        total_discrepancy_usd,
        ai_summary,
        created_at
      FROM reconciliation_logs
      ORDER BY created_at DESC
      LIMIT $1
      `,
      [limit]
    );

    const items = rows.map((row: any) => ({
      id: row.id,
      runId: row.run_id,
      totalTx: Number(row.total_tx),
      mismatchedTx: Number(row.mismatched_tx),
      totalDiscrepancyUsd: Number(row.total_discrepancy_usd ?? 0),
      aiSummary: row.ai_summary,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : (row.created_at as any)
    }));

    return reply.send({ items, limit });
  });

  return app;
}


