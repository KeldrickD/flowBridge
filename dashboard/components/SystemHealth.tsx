"use client";
import { DashboardService } from "@/types/dashboard";

type Props = {
  services: DashboardService[];
};

function dot(status: "healthy" | "degraded" | "down") {
  if (status === "healthy") return "bg-emerald-400";
  if (status === "degraded") return "bg-amber-400";
  return "bg-rose-500";
}

export default function SystemHealth({ services }: Props) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-sm shadow-black/40">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-50">System Health</h2>
        <span className="text-xs text-slate-400">Live</span>
      </div>
      <ul className="space-y-2 text-xs">
        {services.map((s) => (
          <li key={s.key} className="flex items-center justify-between rounded-xl bg-slate-950/40 px-2 py-2">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${dot(s.status)}`} />
              <span className="text-slate-200">{s.name}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span>{s.latencyMs} ms</span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                {s.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}


