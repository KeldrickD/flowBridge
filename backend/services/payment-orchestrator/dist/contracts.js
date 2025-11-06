"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentRouter = createPaymentRouter;
const ethers_1 = require("ethers");
const PaymentRouter_json_1 = __importDefault(require("./abis/PaymentRouter.json"));
const RPC_URL = process.env.ZKSYNC_RPC_URL;
const PAYMENT_ROUTER_ADDRESS = process.env.PAYMENT_ROUTER_ADDRESS;
function createPaymentRouter() {
    const provider = new ethers_1.WebSocketProvider(RPC_URL);
    const contract = new ethers_1.Contract(PAYMENT_ROUTER_ADDRESS, PaymentRouter_json_1.default, provider);
    return { provider, contract };
}
