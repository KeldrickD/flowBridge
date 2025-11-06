import Fastify from "fastify";

const server = Fastify({ logger: true });

const balances: Record<string, number> = {};
const holds: Record<string, { paymentId: string; amount: number }> = {};

server.post("/internal/hold", async (request, reply) => {
  const { paymentId, payer, amount } = request.body as any;
  holds[paymentId] = { paymentId, amount: Number(amount) };
  server.log.info({ paymentId, payer, amount }, "Hold created");
  return reply.send({ status: "ok" });
});

server.post("/internal/settle", async (request, reply) => {
  const { paymentId, payer, payee } = request.body as any;
  const hold = holds[paymentId];
  if (!hold) return reply.code(400).send({ error: "no hold" });
  balances[payer] = (balances[payer] || 0) - hold.amount;
  balances[payee] = (balances[payee] || 0) + hold.amount;
  delete holds[paymentId];
  server.log.info({ paymentId, payer, payee }, "Settlement complete");
  return reply.send({ status: "ok" });
});

server.get("/accounts/:id/balance", async (request, reply) => {
  const { id } = request.params as any;
  return reply.send({ balance: balances[id] || 0 });
});

server.listen({ port: Number(process.env.PORT) || 4500, host: "0.0.0.0" });


