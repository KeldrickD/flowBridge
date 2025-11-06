import axios from "axios";

const BANK_URL = process.env.BANK_URL || "http://bank-mock:4500";

export async function fetchBankBalance(accountId: string): Promise<bigint> {
  const res = await axios.get(`${BANK_URL}/accounts/${encodeURIComponent(accountId)}/balance`);
  const balance = res.data?.balance as number | string | undefined;
  if (balance == null) return 0n;
  const n = typeof balance === "string" ? Number(balance) : balance;
  return BigInt(Math.floor(n));
}


