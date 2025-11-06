type StatCardProps = {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "default" | "warning" | "danger";
};

export default function StatCard({ label, value, sublabel, tone = "default" }: StatCardProps) {
  const toneClasses =
    tone === "warning"
      ? "border-amber-500/40 bg-amber-500/5"
      : tone === "danger"
      ? "border-rose-500/40 bg-rose-500/5"
      : "border-slate-800 bg-slate-900/40";
  const valueTone = tone === "warning" ? "text-amber-300" : tone === "danger" ? "text-rose-300" : "text-slate-50";
  return (
    <article className={`flex flex-col justify-between rounded-2xl border ${toneClasses} p-4 shadow-sm shadow-black/40`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <p className={`text-2xl font-semibold tracking-tight ${valueTone}`}>{value}</p>
      </div>
      {sublabel && <p className="mt-1 text-xs text-slate-400">{sublabel}</p>}
    </article>
  );
}


