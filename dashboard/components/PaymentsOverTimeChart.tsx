"use client";
import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { DashboardPayment } from "@/types/dashboard";
import { formatCompactNumber } from "@/lib/format";

type Props = {
  payments: DashboardPayment[];
};

type ChartPoint = {
  bucketLabel: string;
  count: number;
};

function bucketLabelFromIso(iso: string): string {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function PaymentsOverTimeChart({ payments }: Props) {
  const data: ChartPoint[] = useMemo(() => {
    if (!payments || payments.length === 0) return [];
    const bucketMap = new Map<string, number>();
    for (const p of payments) {
      const label = bucketLabelFromIso(p.createdAt);
      bucketMap.set(label, (bucketMap.get(label) ?? 0) + 1);
    }
    const entries = Array.from(bucketMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([bucketLabel, count]) => ({ bucketLabel, count }));
  }, [payments]);

  const { settledCount, pendingCount, failedCount } = useMemo(() => {
    let settled = 0;
    let pending = 0;
    let failed = 0;
    for (const p of payments) {
      if (p.status === "settled") settled++;
      else if (p.status === "pending") pending++;
      else if (p.status === "failed") failed++;
    }
    return { settledCount: settled, pendingCount: pending, failedCount: failed };
  }, [payments]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-black/40">
      <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">Payments Over Time</h2>
          <p className="text-xs text-slate-400">Volume of payments grouped by minute.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
          <span className="text-slate-400">Total: {formatCompactNumber(payments.length)}</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-emerald-200">Settled {settledCount}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="text-[11px] text-amber-200">Pending {pendingCount}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              <span className="text-[11px] text-rose-200">Failed {failedCount}</span>
            </span>
          </div>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          No payments yet. Seed demo data or create a payment to see activity.
        </div>
      ) : (
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="bucketLabel"
                tickLine={false}
                axisLine={{ stroke: "#1f2937" }}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={{ stroke: "#1f2937" }}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                width={24}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid #1f2937",
                  borderRadius: 8,
                  fontSize: 11,
                  color: "#e5e7eb"
                }}
                labelStyle={{ color: "#9ca3af" }}
                cursor={{ stroke: "#1f2937", strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 1, stroke: "#22d3ee", fill: "#020617" }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}


