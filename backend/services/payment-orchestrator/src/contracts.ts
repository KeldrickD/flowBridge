import { WebSocketProvider, Contract } from "ethers";
import PaymentRouterAbi from "./abis/PaymentRouter.json";

const RPC_URL = process.env.ZKSYNC_RPC_URL!;
const PAYMENT_ROUTER_ADDRESS = process.env.PAYMENT_ROUTER_ADDRESS!;

export function createPaymentRouter() {
  const provider = new WebSocketProvider(RPC_URL);
  const contract = new Contract(PAYMENT_ROUTER_ADDRESS, PaymentRouterAbi as any, provider);
  return { provider, contract };
}


