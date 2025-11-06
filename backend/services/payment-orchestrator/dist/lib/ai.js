"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReconciliationSummary = generateReconciliationSummary;
async function generateReconciliationSummary(input) {
    const { totalTx, mismatchedTx, totalDiscrepancyUsd, topAccounts } = input;
    const rate = totalTx === 0 ? 0 : (mismatchedTx / totalTx) * 100;
    const lines = [];
    lines.push(`Reconciliation run analyzed ${totalTx} transactions.`);
    lines.push(`${mismatchedTx} transactions (${rate.toFixed(2)}%) showed discrepancies.`);
    lines.push(`Total discrepancy: $${totalDiscrepancyUsd.toFixed(2)}.`);
    if (topAccounts.length > 0) {
        const top = topAccounts
            .slice(0, 3)
            .map((a) => `${a.address} ($${a.discrepancy.toFixed(2)})`)
            .join(", ");
        lines.push(`Top accounts by discrepancy: ${top}.`);
    }
    lines.push("No AI model configured yet; template summary generated.");
    return lines.join(" ");
}
