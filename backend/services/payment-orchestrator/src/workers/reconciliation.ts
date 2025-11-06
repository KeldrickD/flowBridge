import { randomUUID } from "crypto";
import pino from "pino";
import { query } from "../lib/db";
import { fetchBankBalance } from "../lib/bank";
import { generateReconciliationSummary } from "../lib/ai";

const log = pino({ name: "reconciliation-worker" });

const LOOKBACK_HOURS = Number(process.env.RECON_LOOKBACK_HOURS || "24");
const USD_PER_WEI = Number(process.env.USD_PER_WEI || "0");

type AccountRow = { address: string; net_flow_wei: string };

async function getActiveAccounts(): Promise<AccountRow[]> {
  const { rows } = await query<AccountRow>(
    `
    SELECT address, SUM(net_flow_wei) AS net_flow_wei
    FROM (
      SELECT payer_address AS address, -amount_wei::numeric AS net_flow_wei
      FROM payments
      WHERE status = 'settled'
        AND created_at >= now() - ($1::interval)
      UNION ALL
      SELECT payee_address AS address, amount_wei::numeric AS net_flow_wei
      FROM payments
      WHERE status = 'settled'
        AND created_at >= now() - ($1::interval)
    ) flows
    GROUP BY address
    `,
    [`${LOOKBACK_HOURS} hours`]
  );
  return rows;
}

async function computeOnchainAndBankBalances() {
  const accounts = await getActiveAccounts();
  log.info({ count: accounts.length }, "Active accounts discovered for reconciliation");
  const results: Array<{ address: string; balanceOnchain: bigint; balanceBank: bigint; discrepancy: bigint }> = [];
  for (const acc of accounts) {
    const netFlowWei = BigInt(acc.net_flow_wei || "0");
    const balanceOnchain = netFlowWei;
    let balanceBank: bigint;
    try {
      balanceBank = await fetchBankBalance(acc.address);
    } catch (err) {
      log.warn({ err, address: acc.address }, "Failed to fetch bank balance, defaulting to 0");
      balanceBank = 0n;
    }
    const discrepancy = balanceOnchain - balanceBank;
    results.push({ address: acc.address, balanceOnchain, balanceBank, discrepancy });
  }
  return results;
}

async function upsertAccounts(
  runId: string,
  accountBalances: Array<{ address: string; balanceOnchain: bigint; balanceBank: bigint; discrepancy: bigint }>
) {
  for (const acc of accountBalances) {
    await query(
      `
      INSERT INTO accounts (address, balance_onchain, balance_bank, discrepancy, last_recon_run_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (address)
      DO UPDATE SET
        balance_onchain = EXCLUDED.balance_onchain,
        balance_bank = EXCLUDED.balance_bank,
        discrepancy = EXCLUDED.discrepancy,
        last_recon_run_id = EXCLUDED.last_recon_run_id
      `,
      [acc.address, acc.balanceOnchain.toString(), acc.balanceBank.toString(), acc.discrepancy.toString(), runId]
    );
  }
}

function sumAbsoluteDiscrepancyUsd(accountBalances: Array<{ discrepancy: bigint }>): number {
  if (USD_PER_WEI === 0) return 0;
  let total = 0;
  for (const acc of accountBalances) {
    const absWei = acc.discrepancy < 0n ? -acc.discrepancy : acc.discrepancy;
    total += Number(absWei) * USD_PER_WEI;
  }
  return total;
}

async function createReconciliationLogSkeleton(
  runId: string,
  totalTx: number,
  mismatchedTx: number,
  totalDiscrepancyUsd: number
) {
  const { rows } = await query<{ id: string }>(
    `
    INSERT INTO reconciliation_logs (
      run_id, total_tx, mismatched_tx, total_discrepancy_usd, ai_summary
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
    [runId, totalTx, mismatchedTx, totalDiscrepancyUsd, null]
  );
  return rows[0].id;
}

async function updateReconciliationLogSummary(id: string, summary: string) {
  await query(
    `
    UPDATE reconciliation_logs
    SET ai_summary = $2
    WHERE id = $1
    `,
    [id, summary]
  );
}

async function countTransactionsInWindow(): Promise<number> {
  const { rows } = await query<{ count: string }>(
    `
    SELECT COUNT(*) AS count
    FROM payments
    WHERE created_at >= now() - ($1::interval)
    `,
    [`${LOOKBACK_HOURS} hours`]
  );
  return Number(rows[0].count || "0");
}

async function countMismatchedTransactions(): Promise<number> {
  const { rows } = await query<{ count: string }>(
    `
    SELECT COUNT(*) AS count
    FROM accounts
    WHERE discrepancy <> 0
    `
  );
  return Number(rows[0].count || "0");
}

export async function runReconciliationOnce() {
  const runId = randomUUID();
  log.info({ runId }, "Starting reconciliation run");

  const accountBalances = await computeOnchainAndBankBalances();
  await upsertAccounts(runId, accountBalances);

  const totalTx = await countTransactionsInWindow();
  const mismatchedTx = await countMismatchedTransactions();
  const totalDiscrepancyUsd = sumAbsoluteDiscrepancyUsd(accountBalances);

  const logRowId = await createReconciliationLogSkeleton(runId, totalTx, mismatchedTx, totalDiscrepancyUsd);

  const sorted = [...accountBalances].sort((a, b) => Number(b.discrepancy) - Number(a.discrepancy));
  const topAccounts = sorted.slice(0, 5).map((a) => ({
    address: a.address,
    discrepancy: USD_PER_WEI === 0 ? 0 : Number(a.discrepancy) * USD_PER_WEI
  }));

  const summary = await generateReconciliationSummary({ runId, totalTx, mismatchedTx, totalDiscrepancyUsd, topAccounts });
  await updateReconciliationLogSummary(logRowId, summary);

  log.info({ runId, totalTx, mismatchedTx, totalDiscrepancyUsd }, "Reconciliation run completed");
}


