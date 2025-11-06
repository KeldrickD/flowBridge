import { FastifyInstance } from "fastify";
import axios from "axios";

export function registerPaymentRoutes(app: FastifyInstance) {
  app.post(
    "/payments",
    { preHandler: [app.authenticate as any] },
    async (request, reply) => {
      const { payerAddress, payeeAddress, amount, escrow } = request.body as any;
      const res = await axios.post(
        String(process.env.ORCHESTRATOR_URL) + "/internal/payments/initiate",
        { payerAddress, payeeAddress, amount, escrow }
      );
      return reply.code(201).send(res.data);
    }
  );

  app.get(
    "/payments/:id",
    { preHandler: [app.authenticate as any] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const res = await axios.get(
        String(process.env.ORCHESTRATOR_URL) + `/internal/payments/${id}`
      );
      return reply.send(res.data);
    }
  );
}


