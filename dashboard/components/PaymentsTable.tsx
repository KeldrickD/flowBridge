"use client";
import { useMemo, useState } from "react";
import { DashboardPayment } from "@/types/dashboard";
import { formatAmount, formatIsoTime, truncateAddress } from "@/lib/format";

type PaymentsTableProps = {
  payments: DashboardPayment[];
};

type StatusFilter = "all" | "settled" | "pending" | "failed";

function statusBadge(status: "settled" | "pending" | "failed") {
  if (status === "settled") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
        Settled
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-300">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-300" />
      Failed
    </span>
  );
}

export default function PaymentsTable({ payments }: PaymentsTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = minAmount ? parseFloat(minAmount) : undefined;
    const max = maxAmount ? parseFloat(maxAmount) : undefined;

    return payments.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;

      if (q) {
        const haystack = (p.paymentHash + p.payerAddress + p.payeeAddress).toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (min !== undefined && p.amount < min) return false;
      if (max !== undefined && p.amount > max) return false;

      return true;
    });
  }, [payments, statusFilter, search, minAmount, maxAmount]);

  async function handleCopy(text: string, key: string) {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => {
          setCopiedKey((prev) => (prev === key ? null : prev));
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to copy", err);
    }
  }

  return (
    <section className="h-full rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-black/40">
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">Recent Payments</h2>
          <p className="text-xs text-slate-400">Real-time stream of on-chain settlements and off-chain refs.</p>
        </div>
        <span className="rounded-full bg-slate-900 px-2 py-1 text-xs text-slate-300">
          Showing {filteredPayments.length} of {payments.length} payments
        </span>
      </div>

      <div className="mb-3 flex flex-col gap-3 text-xs md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-2 text-[11px] uppercase tracking-wide text-slate-400">Status</span>
          {(["all", "settled", "pending", "failed"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-2 py-0.5 ${statusFilter === s ? "bg-slate-700 text-slate-50" : "bg-slate-900 text-slate-300"}`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-2">
            <span className="text-[11px] text-slate-500">Search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="hash / payer / payee"
              className="w-32 bg-transparent text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none md:w-40"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-2">
            <span className="text-[11px] text-slate-500">Amt</span>
            <input
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="min"
              className="w-12 bg-transparent text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none"
            />
            <span className="text-slate-600">–</span>
            <input
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="max"
              className="w-12 bg-transparent text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
        <div className="max-h-80 overflow-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="sticky top-0 z-10 bg-slate-950/95 text-xs uppercase tracking-wide text-slate-400 backdrop-blur">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Payment</th>
                <th className="px-3 py-2 text-left font-medium">Payer → Payee</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Latency</th>
                <th className="px-3 py-2 text-right font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60">
              {filteredPayments.map((p, idx) => (
                <tr key={p.id} className={`hover:bg-slate-900/80 ${idx % 2 === 0 ? "bg-slate-950/40" : "bg-slate-950/10"}`}>
                  <td className="px-3 py-2 font-mono text-[11px] text-slate-300">
                    <div className="flex items-center justify-between gap-2">
                      <span title={p.paymentHash}>{truncateAddress(p.paymentHash, 6)}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(p.paymentHash, `hash-${p.id}`)}
                        className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-800"
                      >
                        {copiedKey === `hash-${p.id}` ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span className="font-mono text-slate-200" title={p.payerAddress}>
                        {truncateAddress(p.payerAddress, 6)}
                      </span>
                      <span className="font-mono text-slate-500 text-[10px]">↓</span>
                      <span className="font-mono text-slate-200" title={p.payeeAddress}>
                        {truncateAddress(p.payeeAddress, 6)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-sm text-slate-100">
                    {formatAmount(p.amount)} <span className="text-xs text-slate-400">{p.currency}</span>
                  </td>
                  <td className="px-3 py-2">{statusBadge(p.status)}</td>
                  <td className="px-3 py-2 text-right text-xs text-slate-300">
                    {p.status === "pending" || p.latencyMs == null ? "—" : `${(p.latencyMs / 1000).toFixed(1)} s`}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-slate-400">{formatIsoTime(p.createdAt)}</td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-xs text-slate-400">
                    No payments match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}


