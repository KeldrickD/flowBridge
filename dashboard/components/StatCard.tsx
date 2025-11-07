import clsx from "clsx";

type Props = {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "default" | "warning";
};

export default function StatCard({ label, value, sublabel, tone = "default" }: Props) {
  return (
    <div
      className={clsx(
        "rounded-2xl border p-4 shadow-sm shadow-black/40 transition-colors",
        tone === "warning" ? "border-amber-500/40 bg-slate-900/70" : "border-slate-800 bg-slate-900/60"
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-slate-50">{value}</p>
      {sublabel && <p className="mt-1 text-[11px] text-slate-400">{sublabel}</p>}
    </div>
  );
}


