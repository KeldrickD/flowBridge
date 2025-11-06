import { FastifyInstance } from "fastify";
import axios from "axios";

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || "http://payment-orchestrator:4100";

export async function registerDashboardRoutes(app: FastifyInstance) {
  app.get("/dashboard", async (request, reply) => {
    try {
      const paymentsLimit = (request.query as any)?.paymentsLimit ?? 20;
      const eventsLimit = (request.query as any)?.eventsLimit ?? 10;
      const [summaryRes, paymentsRes, eventsRes] = await Promise.all([
        axios.get(`${ORCHESTRATOR_URL}/internal/dashboard/summary`),
        axios.get(`${ORCHESTRATOR_URL}/internal/dashboard/payments`, { params: { limit: paymentsLimit } }),
        axios.get(`${ORCHESTRATOR_URL}/internal/dashboard/events`, { params: { limit: eventsLimit } })
      ]);
      const summary = summaryRes.data;
      const payments = paymentsRes.data;
      const events = eventsRes.data;
      return reply.send({ stats: summary.stats, services: summary.services, payments: payments.items, events: events.items });
    } catch (err: any) {
      request.log.error({ err }, "Failed to fetch dashboard data");
      return reply.code(502).send({ error: "dashboard_upstream_error" });
    }
  });

  app.get("/dashboard/payments", async (request, reply) => {
    try {
      const res = await axios.get(`${ORCHESTRATOR_URL}/internal/dashboard/payments`, { params: request.query });
      return reply.send(res.data);
    } catch (err: any) {
      request.log.error({ err }, "Failed to fetch dashboard payments");
      return reply.code(502).send({ error: "dashboard_payments_upstream_error" });
    }
  });

  app.get("/dashboard/events", async (request, reply) => {
    try {
      const res = await axios.get(`${ORCHESTRATOR_URL}/internal/dashboard/events`, { params: request.query });
      return reply.send(res.data);
    } catch (err: any) {
      request.log.error({ err }, "Failed to fetch dashboard events");
      return reply.code(502).send({ error: "dashboard_events_upstream_error" });
    }
  });

  app.get("/dashboard/health", async (request, reply) => {
    try {
      const res = await axios.get(`${ORCHESTRATOR_URL}/internal/dashboard/health`);
      return reply.send(res.data);
    } catch (err: any) {
      request.log.error({ err }, "Failed to fetch dashboard health");
      return reply.code(502).send({ error: "dashboard_health_upstream_error" });
    }
  });

  app.get("/dashboard/reconciliation", async (request, reply) => {
    try {
      const res = await axios.get(`${ORCHESTRATOR_URL}/internal/dashboard/reconciliation`, { params: request.query });
      return reply.send(res.data);
    } catch (err: any) {
      request.log.error({ err }, "Failed to fetch reconciliation runs");
      return reply.code(502).send({ error: "dashboard_reconciliation_upstream_error" });
    }
  });
}


