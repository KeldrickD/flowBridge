import { FastifyInstance } from "fastify";

export function registerWebhookRoutes(app: FastifyInstance) {
  app.post(
    "/webhooks/partner",
    async (request, reply) => {
      const { url, eventTypes } = request.body as any;
      app.log.info({ url, eventTypes }, "Registered webhook");
      return reply.code(201).send({ status: "ok" });
    }
  );
}


