"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runReconciliationOnce = runReconciliationOnce;
const crypto_1 = require("crypto");
const pino_1 = __importDefault(require("pino"));
const db_1 = require("../lib/db");
const bank_1 = require("../lib/bank");
const ai_1 = require("../lib/ai");
const log = (0, pino_1.default)({ name: "reconciliation-worker" });
const LOOKBACK_HOURS = Number(process.env.RECON_LOOKBACK_HOURS || "24");
const USD_PER_WEI = Number(process.env.USD_PER_WEI || "0");
async function getActiveAccounts() {
    const { rows } = await (0, db_1.query)(`
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
    `, [`${LOOKBACK_HOURS} hours`]);
    return rows;
}
async function computeOnchainAndBankBalances() {
    const accounts = await getActiveAccounts();
    log.info({ count: accounts.length }, "Active accounts discovered for reconciliation");
    const results = [];
    for (const acc of accounts) {
        const netFlowWei = BigInt(acc.net_flow_wei || "0");
        const balanceOnchain = netFlowWei;
        let balanceBank;
        try {
            balanceBank = await (0, bank_1.fetchBankBalance)(acc.address);
        }
        catch (err) {
            log.warn({ err, address: acc.address }, "Failed to fetch bank balance, defaulting to 0");
            balanceBank = 0n;
        }
        const discrepancy = balanceOnchain - balanceBank;
        results.push({ address: acc.address, balanceOnchain, balanceBank, discrepancy });
    }
    return results;
}
async function upsertAccounts(runId, accountBalances) {
    for (const acc of accountBalances) {
        await (0, db_1.query)(`
      INSERT INTO accounts (address, balance_onchain, balance_bank, discrepancy, last_recon_run_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (address)
      DO UPDATE SET
        balance_onchain = EXCLUDED.balance_onchain,
        balance_bank = EXCLUDED.balance_bank,
        discrepancy = EXCLUDED.discrepancy,
        last_recon_run_id = EXCLUDED.last_recon_run_id
      `, [acc.address, acc.balanceOnchain.toString(), acc.balanceBank.toString(), acc.discrepancy.toString(), runId]);
    }
}
function sumAbsoluteDiscrepancyUsd(accountBalances) {
    if (USD_PER_WEI === 0)
        return 0;
    let total = 0;
    for (const acc of accountBalances) {
        const absWei = acc.discrepancy < 0n ? -acc.discrepancy : acc.discrepancy;
        total += Number(absWei) * USD_PER_WEI;
    }
    return total;
}
async function createReconciliationLogSkeleton(runId, totalTx, mismatchedTx, totalDiscrepancyUsd) {
    const { rows } = await (0, db_1.query)(`
    INSERT INTO reconciliation_logs (
      run_id, total_tx, mismatched_tx, total_discrepancy_usd, ai_summary
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `, [runId, totalTx, mismatchedTx, totalDiscrepancyUsd, null]);
    return rows[0].id;
}
async function updateReconciliationLogSummary(id, summary) {
    await (0, db_1.query)(`
    UPDATE reconciliation_logs
    SET ai_summary = $2
    WHERE id = $1
    `, [id, summary]);
}
async function countTransactionsInWindow() {
    const { rows } = await (0, db_1.query)(`
    SELECT COUNT(*) AS count
    FROM payments
    WHERE created_at >= now() - ($1::interval)
    `, [`${LOOKBACK_HOURS} hours`]);
    return Number(rows[0].count || "0");
}
async function countMismatchedTransactions() {
    const { rows } = await (0, db_1.query)(`
    SELECT COUNT(*) AS count
    FROM accounts
    WHERE discrepancy <> 0
    `);
    return Number(rows[0].count || "0");
}
async function runReconciliationOnce() {
    const runId = (0, crypto_1.randomUUID)();
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
    const summary = await (0, ai_1.generateReconciliationSummary)({ runId, totalTx, mismatchedTx, totalDiscrepancyUsd, topAccounts });
    await updateReconciliationLogSummary(logRowId, summary);
    log.info({ runId, totalTx, mismatchedTx, totalDiscrepancyUsd }, "Reconciliation run completed");
}
