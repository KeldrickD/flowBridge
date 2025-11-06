import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import PaymentsTable from "@/components/PaymentsTable";
import SystemHealth from "@/components/SystemHealth";
import EventTimeline from "@/components/EventTimeline";
import ReconciliationPanel from "@/components/ReconciliationPanel";
import PaymentsSparkline from "@/components/PaymentsSparkline";
import { formatNumberShort } from "@/lib/format";
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
  const statsCards = [
    {
      label: "Total Payments (24h)",
      value: formatNumberShort(data.stats.totalPayments24h),
      sublabel: `Failed: ${data.stats.failedPayments24h.toLocaleString()}`
    },
    {
      label: "Settlement Success",
      value: `${(data.stats.settlementSuccessRate * 100).toFixed(1)}%`,
      sublabel: `Failed: ${data.stats.failedPayments24h.toLocaleString()}`
    },
    {
      label: "Avg. Settlement Latency",
      value: `${(data.stats.avgSettlementLatencyMs / 1000).toFixed(1)} s`,
      sublabel: `P95: ${(data.stats.p95SettlementLatencyMs / 1000).toFixed(1)} s`
    },
    {
      label: "Ledger Discrepancies",
      value: data.stats.ledgerDiscrepancies.toString(),
      sublabel: `>1 USD: ${data.stats.ledgerDiscrepanciesOver1Usd}`,
      tone: data.stats.ledgerDiscrepancies > 0 ? "warning" : "default"
    }
  ];

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 pb-8 pt-4 md:px-6">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} sublabel={s.sublabel} tone={s.tone as any} />
          ))}
        </section>
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <PaymentsSparkline />
          </div>
        </section>
        <section className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
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


