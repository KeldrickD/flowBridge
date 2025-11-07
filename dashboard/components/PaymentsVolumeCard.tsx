"use client";
import { useMemo } from "react";
import { DashboardPayment } from "@/types/dashboard";
import { formatAmount, formatCompactNumber } from "@/lib/format";

type Props = {
  payments: DashboardPayment[];
};

export default function PaymentsVolumeCard({ payments }: Props) {
  const { settledVolume, settledCount } = useMemo(() => {
    let volume = 0;
    let count = 0;
    for (const p of payments) {
      if (p.status === "settled") {
        volume += p.amount;
        count++;
      }
    }
    return { settledVolume: volume, settledCount: count };
  }, [payments]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-black/40">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">24h Volume (Settled)</p>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <p className="text-xl font-semibold tracking-tight text-slate-50">${formatAmount(settledVolume)}</p>
      </div>
      <p className="mt-1 text-[11px] text-slate-400">
        {settledCount === 0
          ? "No settled payments yet."
          : `${formatCompactNumber(settledCount)} settled payment${settledCount === 1 ? "" : "s"} in this window.`}
      </p>
    </section>
  );
}


