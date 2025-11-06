"use client";
import { DashboardPayment } from "@/types/dashboard";
import { truncateAddress, formatCurrencyShort } from "@/lib/format";

type PaymentsTableProps = {
  payments: DashboardPayment[];
};

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

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour12: false });
}

export default function PaymentsTable({ payments }: PaymentsTableProps) {
  return (
    <section className="h-full rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm shadow-black/40">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">Recent Payments</h2>
          <p className="text-xs text-slate-400">Real-time stream of on-chain settlements and off-chain refs.</p>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">Showing {payments.length} payments</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-400">
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
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-900/80">
                <td className="px-3 py-2 font-mono text-xs text-slate-300">{p.id}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span className="font-mono text-slate-200">{truncateAddress(p.payerAddress)}</span>
                    <span className="font-mono text-slate-500">↓</span>
                    <span className="font-mono text-slate-200">{truncateAddress(p.payeeAddress)}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right text-sm text-slate-100">{formatCurrencyShort(p.amount, p.currency)}</td>
                <td className="px-3 py-2">{statusBadge(p.status)}</td>
                <td className="px-3 py-2 text-right text-xs text-slate-300">
                  {p.status === "pending" || p.latencyMs == null ? "—" : `${(p.latencyMs / 1000).toFixed(1)} s`}
                </td>
                <td className="px-3 py-2 text-right text-xs text-slate-400">{formatTime(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}


