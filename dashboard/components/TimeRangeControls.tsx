"use client";
import { useState } from "react";

type Range = "5m" | "1h" | "24h" | "7d";
type Props = {
  initial?: Range;
};

export default function TimeRangeControls({ initial = "24h" }: Props) {
  const [range, setRange] = useState<Range>(initial);
  const ranges: Range[] = ["5m", "1h", "24h", "7d"];
  return (
    <div className="flex items-center justify-between text-xs text-slate-400">
      <span>Time range</span>
      <div className="rounded-full bg-slate-900 px-1 py-1">
        {ranges.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-full px-2 py-0.5 ${
              range === r ? "bg-slate-700 text-slate-50" : "text-slate-300"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}


