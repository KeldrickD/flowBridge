import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { registerPaymentRoutes } from "./routes/payments";
import { registerWebhookRoutes } from "./routes/webhooks";
import { registerDashboardRoutes } from "./routes/dashboard";

const server = Fastify({ logger: true });

server.register(cors, { origin: true });
server.register(jwt, {
  secret: process.env.JWT_SECRET || "dev-secret"
});

server.decorate(
  "authenticate",
  async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: "unauthorized" });
    }
  }
);

server.register(async (instance) => {
  registerPaymentRoutes(instance);
  registerWebhookRoutes(instance);
  registerDashboardRoutes(instance);
}, { prefix: "/v1" });

const start = async () => {
  try {
    await server.listen({ port: Number(process.env.PORT) || 4000, host: "0.0.0.0" });
    server.log.info("API Gateway started");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();


