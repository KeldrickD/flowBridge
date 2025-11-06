"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pino_1 = __importDefault(require("pino"));
const axios_1 = __importDefault(require("axios"));
const ioredis_1 = __importDefault(require("ioredis"));
const contracts_1 = require("./contracts");
const http_1 = require("./http");
const PaymentRouter_json_1 = __importDefault(require("./abis/PaymentRouter.json"));
const log = (0, pino_1.default)();
const redis = new ioredis_1.default(String(process.env.REDIS_URL || "redis://localhost:6379"));
redis.on("error", (err) => log.error(err, "Redis connection failed"));
async function main() {
    const shouldSubscribe = Boolean(process.env.ZKSYNC_RPC_URL) && Boolean(process.env.PAYMENT_ROUTER_ADDRESS) && Array.isArray(PaymentRouter_json_1.default) && PaymentRouter_json_1.default.length > 0;
    if (shouldSubscribe) {
        const { contract } = (0, contracts_1.createPaymentRouter)();
        contract.on("PaymentInitiated", async (paymentId, payer, payee, amount, escrow, offchainRef) => {
            log.info({ paymentId, payer, payee, amount: amount.toString(), escrow }, "PaymentInitiated");
            await redis.xadd("payments", "*", "type", "PaymentInitiated", "paymentId", paymentId, "payer", payer, "payee", payee, "amount", amount.toString(), "offchainRef", offchainRef);
            try {
                await axios_1.default.post(String(process.env.BANK_URL) + "/internal/hold", {
                    paymentId,
                    payer,
                    payee,
                    amount: amount.toString()
                });
            }
            catch (err) {
                log.error(err, "Failed to notify bank mock");
            }
        });
        contract.on("PaymentSettled", async (paymentId, payer, payee, amount) => {
            log.info({ paymentId, payer, payee, amount: amount.toString() }, "PaymentSettled");
            await redis.xadd("payments", "*", "type", "PaymentSettled", "paymentId", paymentId, "amount", amount.toString());
        });
        log.info("Payment orchestrator listening to on-chain events");
    }
    else {
        log.warn("On-chain event subscription disabled (missing ZKSYNC envs or ABI). HTTP server will still start.");
    }
    const app = await (0, http_1.createHttpServer)();
    const port = Number(process.env.PORT || 4100);
    await app.listen({ port, host: "0.0.0.0" });
    log.info({ port }, "Orchestrator HTTP server started");
}
main().catch(err => {
    console.error(err);
    process.exit(1);
});
