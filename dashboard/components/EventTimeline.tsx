"use client";
import { DashboardEvent } from "@/types/dashboard";

type Props = {
  events: DashboardEvent[];
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour12: false });
}

export default function EventTimeline({ events }: Props) {
  return (
    <section className="flex flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-sm shadow-black/40">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-50">Event Timeline</h2>
        <span className="text-xs text-slate-400">Recent</span>
      </div>
      <div className="relative mt-2 flex-1">
        <div className="absolute left-2 top-0 h-full w-px bg-slate-800" />
        <ul className="space-y-3 pl-5 text-xs">
          {events.map((e, idx) => (
            <li key={idx} className="relative">
              <div className="absolute left-[-9px] top-1.5 h-2 w-2 rounded-full bg-cyan-400" />
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-slate-400">{formatTime(e.time)}</span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                  {e.type}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-slate-200">{e.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}


