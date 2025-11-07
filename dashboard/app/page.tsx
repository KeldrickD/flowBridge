import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import PaymentsTable from "@/components/PaymentsTable";
import SystemHealth from "@/components/SystemHealth";
import EventTimeline from "@/components/EventTimeline";
import ReconciliationPanel from "@/components/ReconciliationPanel";
import PaymentsOverTimeChart from "@/components/PaymentsOverTimeChart";
import PaymentsVolumeCard from "@/components/PaymentsVolumeCard";
import TimeRangeControls from "@/components/TimeRangeControls";
import { formatCompactNumber, formatInteger, formatIsoDateTime } from "@/lib/format";
import { DemoApiResponse } from "@/types/dashboard";

async function getDashboardData(): Promise<DemoApiResponse> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const res = await fetch(`${base}/dashboard`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch demo data");
  }
  return res.json();
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const generatedAt = new Date().toISOString();
  const anyDown = data.services.some((s) => s.status === "down");
  const anyDegraded = data.services.some((s) => s.status === "degraded");
  let statusLabel: "Healthy" | "Degraded" | "Issues" = "Healthy";
  let statusColorClass =
    "inline-flex items-center gap-1 text-emerald-300";
  if (anyDown) {
    statusLabel = "Issues";
    statusColorClass = "inline-flex items-center gap-1 text-rose-300";
  } else if (anyDegraded) {
    statusLabel = "Degraded";
    statusColorClass = "inline-flex items-center gap-1 text-amber-300";
  }
  const failureRate =
    data.stats.totalPayments24h === 0
      ? 0
      : data.stats.failedPayments24h / data.stats.totalPayments24h;
  const statsCards = [
    {
      label: "Total Payments (24h)",
      value: formatCompactNumber(data.stats.totalPayments24h),
      sublabel: `Failed: ${formatInteger(data.stats.failedPayments24h)}`
    },
    {
      label: "Settlement Success",
      value: `${(data.stats.settlementSuccessRate * 100).toFixed(1)}%`,
      sublabel: `Failure rate: ${(failureRate * 100).toFixed(1)}%`
    },
    {
      label: "Avg. Settlement Latency",
      value: `${(data.stats.avgSettlementLatencyMs / 1000).toFixed(1)} s`,
      sublabel: `P95: ${(data.stats.p95SettlementLatencyMs / 1000).toFixed(1)} s`
    },
    {
      label: "Ledger Discrepancies",
      value: formatInteger(data.stats.ledgerDiscrepancies),
      sublabel: `>1 USD: ${formatInteger(data.stats.ledgerDiscrepanciesOver1Usd)}`,
      tone: data.stats.ledgerDiscrepancies > 0 ? "warning" : "default"
    }
  ];

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 pb-8 pt-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            Status:{" "}
            <span className={statusColorClass}>
              <span className="h-2 w-2 rounded-full bg-current" />
              {statusLabel}
            </span>
          </span>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1 text-[11px] text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Data as of {formatIsoDateTime(generatedAt)}
            </span>
          </div>
        </div>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} sublabel={s.sublabel} tone={s.tone as any} />
          ))}
        </section>
        <section className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <TimeRangeControls />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <PaymentsOverTimeChart payments={data.payments} />
              </div>
              <PaymentsVolumeCard payments={data.payments} />
            </div>
            <PaymentsTable payments={data.payments} />
          </div>
          <div className="flex flex-col gap-4">
            <SystemHealth services={data.services} />
            <EventTimeline events={data.events} />
          </div>
        </section>
        <ReconciliationPanel />
      </div>
    </main>
  );
}


