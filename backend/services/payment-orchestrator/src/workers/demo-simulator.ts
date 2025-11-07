import { query } from "../lib/db";

const STATUSES = ["settled", "pending", "failed"] as const;
type Status = (typeof STATUSES)[number];

function randomStatus(): Status {
  const r = Math.random();
  if (r < 0.7) return "settled";
  if (r < 0.9) return "pending";
  return "failed";
}

function randomAddress(): string {
  const hex = [...Array(40)].map(() => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
  return "0x" + hex;
}

function dollarsToWei(amount: number): string {
  const wei = BigInt(Math.floor(amount)) * BigInt(10) ** BigInt(18);
  return wei.toString();
}

async function insertDemoPayment() {
  const status = randomStatus();
  const amountUsd = 100 + Math.random() * 10_000;
  const amountWei = dollarsToWei(amountUsd);
  const latencyMs = status === "settled" ? Math.floor(1000 + Math.random() * 5000) : null;
  const payer = randomAddress();
  const payee = randomAddress();
  const paymentHash = randomAddress();
  const offchainRef = randomAddress();
  const nowIso = new Date().toISOString();

  const res = await query<{ id: string }>(
    `
      INSERT INTO payments (
        payment_hash,
        payer_address,
        payee_address,
        amount_wei,
        currency,
        status,
        latency_ms,
        offchain_ref,
        tx_hash,
        chain_id,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, 'fbUSD', $5, $6, $7, NULL, 280, $8, $8
      )
      RETURNING id
    `,
    [paymentHash, payer, payee, amountWei, status, latencyMs, offchainRef, nowIso]
  );

  const paymentId = res.rows[0].id;

  await query(
    `
      INSERT INTO payment_events (
        payment_id,
        event_type,
        payload,
        source,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5)
    `,
    [
      paymentId,
      status === "settled" ? "payment.settled" : status === "failed" ? "payment.failed" : "payment.initiated",
      JSON.stringify({
        paymentHash,
        amountWei,
        status,
        payer,
        payee
      }),
      "demo-simulator",
      nowIso
    ]
  );

  console.log(`[demo] payment ${paymentId} (${status}) amountWei=${amountWei}`);
}

async function main() {
  const intervalMs = Number(process.env.DEMO_INTERVAL_MS ?? "15000");
  console.log(`[demo] simulator starting (interval ${intervalMs}ms)`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await insertDemoPayment();
    } catch (err) {
      console.error("[demo] failed to insert demo payment", err);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

main().catch((err) => {
  console.error("[demo] fatal error", err);
  process.exit(1);
});

