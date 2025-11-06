"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchBankBalance = fetchBankBalance;
const axios_1 = __importDefault(require("axios"));
const BANK_URL = process.env.BANK_URL || "http://bank-mock:4500";
async function fetchBankBalance(accountId) {
    const res = await axios_1.default.get(`${BANK_URL}/accounts/${encodeURIComponent(accountId)}/balance`);
    const balance = res.data?.balance;
    if (balance == null)
        return 0n;
    const n = typeof balance === "string" ? Number(balance) : balance;
    return BigInt(Math.floor(n));
}
