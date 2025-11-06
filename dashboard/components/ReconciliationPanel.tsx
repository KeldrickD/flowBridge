"use client";
import { useEffect, useState } from "react";
import { ReconciliationRun } from "@/types/dashboard";

type State =
  | { status: "idle" | "loading" }
  | { status: "error"; error: string }
  | { status: "loaded"; runs: ReconciliationRun[] };

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

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
        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">Last 10 runs</span>
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

      {state.status === "loaded" && state.runs.length > 0 ? (
        <ul className="space-y-4">
          {state.runs.map((run) => (
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
                  <span className="font-mono text-[11px] text-slate-400">{formatDateTime(run.createdAt)}</span>
                  <span className="text-slate-200">
                    Run <span className="font-mono text-[11px] text-slate-300">{run.runId}</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
                  <span>
                    <span className="text-slate-400">Tx:</span> {run.totalTx.toLocaleString()}
                  </span>
                  <span>
                    <span className="text-slate-400">Mismatched:</span> {run.mismatchedTx.toLocaleString()}
                  </span>
                  <span className={`${run.totalDiscrepancyUsd <= 0 ? "text-emerald-300" : run.totalDiscrepancyUsd < 10 ? "text-amber-300" : "text-rose-300"}`}>
                    <span className="text-slate-400">Total Δ:</span> ${run.totalDiscrepancyUsd.toFixed(2)}
                  </span>
                </div>
              </div>
              {run.aiSummary ? (
                <p className="mt-2 text-[11px] leading-snug text-slate-200">{run.aiSummary}</p>
              ) : (
                <p className="mt-2 text-[11px] leading-snug text-slate-400">No AI summary yet for this run.</p>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}


