"use client";
import { useEffect, useState } from "react";
import { ReconciliationRun } from "@/types/dashboard";
import { formatAmount, formatInteger, formatIsoDateTime } from "@/lib/format";

type State =
  | { status: "idle" | "loading" }
  | { status: "error"; error: string }
  | { status: "loaded"; runs: ReconciliationRun[] };

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";
type Filter = "all" | "gt0" | "gt10";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

export default function ReconciliationPanel() {
  const [state, setState] = useState<State>({ status: "idle" });
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setState({ status: "loading" });
      try {
        const res = await fetch(`${BASE_URL}/dashboard/reconciliation?limit=10`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: { items: ReconciliationRun[]; limit: number } = await res.json();
        if (!cancelled) setState({ status: "loaded", runs: data.items });
      } catch (err: any) {
        if (!cancelled) setState({ status: "error", error: err?.message ?? "Failed to load reconciliation runs" });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-black/40">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-50 md:text-base">Reconciliation Runs</h2>
          <p className="text-xs text-slate-400">Periodic comparisons of on-chain and bank ledgers with AI summaries.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-slate-900 px-1 py-1 text-[11px] text-slate-300">
            <button onClick={() => setFilter("all")} className={`rounded-full px-2 py-0.5 ${filter === "all" ? "bg-slate-700 text-slate-50" : "text-slate-300"}`}>All</button>
            <button onClick={() => setFilter("gt0")} className={`rounded-full px-2 py-0.5 ${filter === "gt0" ? "bg-slate-700 text-slate-50" : "text-slate-300"}`}>Δ &gt; 0</button>
            <button onClick={() => setFilter("gt10")} className={`rounded-full px-2 py-0.5 ${filter === "gt10" ? "bg-slate-700 text-slate-50" : "text-slate-300"}`}>Δ &gt; 10</button>
          </div>
          <span className="rounded-full bg-slate-900 px-2 py-1 text-xs text-slate-300">Last 10 runs</span>
        </div>
      </div>

      {state.status === "loading" || state.status === "idle" ? (
        <div className="py-6 text-center text-xs text-slate-400">Loading reconciliation history…</div>
      ) : null}

      {state.status === "error" ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-3 text-xs text-rose-100">
          Failed to load reconciliation runs: <span className="font-mono">{state.error}</span>
        </div>
      ) : null}

      {state.status === "loaded" && state.runs.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          No reconciliation runs recorded yet. Run <span className="font-mono text-slate-200">npm run reconcile:once</span> to create the first one.
        </div>
      ) : null}

      {state.status === "loaded" && state.runs.length > 0 ? (() => {
        let runs = state.runs;
        if (filter === "gt0") runs = runs.filter((r) => r.totalDiscrepancyUsd > 0);
        else if (filter === "gt10") runs = runs.filter((r) => r.totalDiscrepancyUsd > 10);
        if (runs.length === 0) {
          return <div className="py-4 text-center text-xs text-slate-400">No runs match this filter.</div>;
        }
        return (
        <ul className="space-y-4">
          {runs.map((run) => (
            <li
              key={run.id}
              className={`rounded-2xl border px-3 py-3 text-xs shadow-sm shadow-black/40 ${
                run.totalDiscrepancyUsd <= 0
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : run.totalDiscrepancyUsd < 10
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-rose-500/30 bg-rose-500/5"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-mono text-[11px] text-slate-400">{formatIsoDateTime(run.createdAt)}</span>
                  <span className="text-slate-200">
                    Run <span className="font-mono text-[11px] text-slate-300">{run.runId}</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
                  <span>
                    <span className="text-slate-400">Tx:</span> {formatInteger(run.totalTx)}
                  </span>
                  <span>
                    <span className="text-slate-400">Mismatched:</span> {formatInteger(run.mismatchedTx)}
                  </span>
                  <span className={`${run.totalDiscrepancyUsd <= 0 ? "text-emerald-300" : run.totalDiscrepancyUsd < 10 ? "text-amber-300" : "text-rose-300"}`}>
                    <span className="text-slate-400">Total Δ:</span> ${formatAmount(run.totalDiscrepancyUsd)}
                  </span>
                </div>
              </div>
              {run.aiSummary ? (
                <p className="mt-2 text-[11px] leading-snug text-slate-200 line-clamp-3">{run.aiSummary}</p>
              ) : (
                <p className="mt-2 text-[11px] leading-snug text-slate-400">No AI summary yet for this run.</p>
              )}
            </li>
          ))}
        </ul>
        );
      })() : null}
    </section>
  );
}


