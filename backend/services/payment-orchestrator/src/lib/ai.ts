export type ReconciliationSummaryInput = {
  runId: string;
  totalTx: number;
  mismatchedTx: number;
  totalDiscrepancyUsd: number;
  topAccounts: Array<{ address: string; discrepancy: number }>;
};

export async function generateReconciliationSummary(input: ReconciliationSummaryInput): Promise<string> {
  const { totalTx, mismatchedTx, totalDiscrepancyUsd, topAccounts } = input;
  const rate = totalTx === 0 ? 0 : (mismatchedTx / totalTx) * 100;
  const lines: string[] = [];
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


