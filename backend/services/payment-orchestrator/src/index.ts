import dotenv from "dotenv";
dotenv.config();
import pino from "pino";
import axios from "axios";
import Redis from "ioredis";
import { createPaymentRouter } from "./contracts";
import { createHttpServer } from "./http";
import PaymentRouterAbi from "./abis/PaymentRouter.json";

const log = pino();
const redis = new Redis(String(process.env.REDIS_URL || "redis://localhost:6379"));
redis.on("error", (err: unknown) => log.error(err as any, "Redis connection failed"));

async function main() {
  const shouldSubscribe = Boolean(process.env.ZKSYNC_RPC_URL) && Boolean(process.env.PAYMENT_ROUTER_ADDRESS) && Array.isArray(PaymentRouterAbi) && PaymentRouterAbi.length > 0;
  if (shouldSubscribe) {
    const { contract } = createPaymentRouter();
    contract.on(
      "PaymentInitiated",
      async (paymentId: string, payer: string, payee: string, amount: any, escrow: boolean, offchainRef: string) => {
        log.info(
          { paymentId, payer, payee, amount: amount.toString(), escrow },
          "PaymentInitiated"
        );
        await redis.xadd(
          "payments",
          "*",
          "type",
          "PaymentInitiated",
          "paymentId",
          paymentId,
          "payer",
          payer,
          "payee",
          payee,
          "amount",
          amount.toString(),
          "offchainRef",
          offchainRef
        );
        try {
          await axios.post(String(process.env.BANK_URL) + "/internal/hold", {
            paymentId,
            payer,
            payee,
            amount: amount.toString()
          });
        } catch (err) {
          log.error(err, "Failed to notify bank mock");
        }
      }
    );
    contract.on("PaymentSettled", async (paymentId: string, payer: string, payee: string, amount: any) => {
      log.info({ paymentId, payer, payee, amount: amount.toString() }, "PaymentSettled");
      await redis.xadd(
        "payments",
        "*",
        "type",
        "PaymentSettled",
        "paymentId",
        paymentId,
        "amount",
        amount.toString()
      );
    });
    log.info("Payment orchestrator listening to on-chain events");
  } else {
    log.warn("On-chain event subscription disabled (missing ZKSYNC envs or ABI). HTTP server will still start.");
  }

  const app = await createHttpServer();
  const port = Number(process.env.PORT || 4100);
  await app.listen({ port, host: "0.0.0.0" });
  log.info({ port }, "Orchestrator HTTP server started");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


