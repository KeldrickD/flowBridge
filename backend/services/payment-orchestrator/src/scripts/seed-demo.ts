import { randomUUID } from "crypto";
import pino from "pino";
import { query } from "../lib/db";

const log = pino({ name: "seed-demo" });

type SeedPayment = {
  paymentHash: string;
  payerAddress: string;
  payeeAddress: string;
  amountWei: bigint;
  currency: string;
  status: "pending" | "settled" | "failed";
  latencyMs: number | null;
  offchainRef: string | null;
  txHash: string | null;
  chainId: number;
};

const now = new Date();

const demoPayments: SeedPayment[] = [
  {
    paymentHash: "0x3ab1e7fabc123",
    payerAddress: "0xA11CE00000000000000000000000000000000001",
    payeeAddress: "0xB0B0000000000000000000000000000000000042",
    amountWei: BigInt("250000000000000000000"),
    currency: "fbUSD",
    status: "settled",
    latencyMs: 3200,
    offchainRef: "ACH-REF-001",
    txHash: "0x4f98deadbeef",
    chainId: 280
  },
  {
    paymentHash: "0x9c42ab0aaafe",
    payerAddress: "0xC0FFEE0000000000000000000000000000001234",
    payeeAddress: "0xD34D000000000000000000000000000000005678",
    amountWei: BigInt("1200000000000000000000"),
    currency: "fbUSD",
    status: "pending",
    latencyMs: null,
    offchainRef: "ACH-REF-002",
    txHash: null,
    chainId: 280
  },
  {
    paymentHash: "0x7de199c0ffee",
    payerAddress: "0xA11CE00000000000000000000000000000000001",
    payeeAddress: "0xFEE1000000000000000000000000000000BADD00",
    amountWei: BigInt("75500000000000000000"),
    currency: "fbUSD",
    status: "failed",
    latencyMs: 5200,
    offchainRef: "ACH-REF-003",
    txHash: "0xdeadbeefcafe",
    chainId: 280
  },
  {
    paymentHash: "0x4aa0110deadb",
    payerAddress: "0xBEEF000000000000000000000000000000002048",
    payeeAddress: "0xB0B0000000000000000000000000000000000042",
    amountWei: BigInt("980000000000000000000"),
    currency: "fbUSD",
    status: "settled",
    latencyMs: 2800,
    offchainRef: "ACH-REF-004",
    txHash: "0x98adf00dbabe",
    chainId: 280
  }
];

async function clearExistingDemo() {
  await query(
    `
    DELETE FROM payment_events
    WHERE payment_id IN (
      SELECT id FROM payments WHERE payment_hash IN ($1,$2,$3,$4)
    )
  `,
    demoPayments.map((p) => p.paymentHash)
  );

  await query(
    `
    DELETE FROM payments
    WHERE payment_hash IN ($1, $2, $3, $4)
    `,
    demoPayments.map((p) => p.paymentHash)
  );
}

async function seedPayments() {
  const createdRows: { id: string; payment: SeedPayment }[] = [];
  for (let i = 0; i < demoPayments.length; i++) {
    const p = demoPayments[i];
    const createdAt = new Date(now.getTime() - i * 60_000);
    const { rows } = await query<{ id: string }>(
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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)
      RETURNING id
      `,
      [
        p.paymentHash,
        p.payerAddress,
        p.payeeAddress,
        p.amountWei.toString(),
        p.currency,
        p.status,
        p.latencyMs,
        p.offchainRef,
        p.txHash,
        p.chainId,
        createdAt.toISOString()
      ]
    );
    createdRows.push({ id: rows[0].id, payment: p });
  }
  return createdRows;
}

async function seedPaymentEvents(created: { id: string; payment: SeedPayment }[]) {
  for (const { id, payment } of created) {
    const basePayload = {
      paymentId: payment.paymentHash,
      payer: payment.payerAddress,
      payee: payment.payeeAddress,
      amountWei: payment.amountWei.toString(),
      currency: payment.currency
    };

    await query(
      `
      INSERT INTO payment_events (
        payment_id,
        event_type,
        payload,
        tx_hash,
        block_number,
        source,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
      [
        id,
        "payment.initiated",
        JSON.stringify(basePayload),
        payment.txHash ?? null,
        1000,
        "onchain",
        new Date(now.getTime() - 5 * 60_000).toISOString()
      ]
    );

    if (payment.status === "settled") {
      await query(
        `
        INSERT INTO payment_events (
          payment_id,
          event_type,
          payload,
          tx_hash,
          block_number,
          source,
          created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        `,
        [
          id,
          "payment.settled",
          JSON.stringify(basePayload),
          payment.txHash ?? null,
          1005,
          "onchain",
          new Date(now.getTime() - 3 * 60_000).toISOString()
        ]
      );
    }

    if (payment.status === "failed") {
      await query(
        `
        INSERT INTO payment_events (
          payment_id,
          event_type,
          payload,
          tx_hash,
          block_number,
          source,
          created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        `,
        [
          id,
          "payment.failed",
          JSON.stringify({ ...basePayload, reason: "Insufficient escrow" }),
          payment.txHash ?? null,
          1003,
          "onchain",
          new Date(now.getTime() - 4 * 60_000).toISOString()
        ]
      );
    }
  }
}

async function main() {
  try {
    log.info("Seeding demo payments & events…");
    await clearExistingDemo();
    const created = await seedPayments();
    await seedPaymentEvents(created);
    log.info({ count: created.length }, "Demo seed complete");
    process.exit(0);
  } catch (err) {
    log.error({ err }, "Demo seed failed");
    process.exit(1);
  }
}

main();


