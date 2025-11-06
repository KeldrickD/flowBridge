"use client";
import { Line, LineChart, ResponsiveContainer } from "recharts";

const demo = Array.from({ length: 24 }).map((_, i) => ({ x: i, y: Math.round(10 + Math.random() * 40) }));

export default function PaymentsSparkline() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">Payments per hour</span>
        <span className="text-[10px] text-slate-500">demo</span>
      </div>
      <div style={{ width: "100%", height: 60 }}>
        <ResponsiveContainer>
          <LineChart data={demo} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
            <Line type="monotone" dataKey="y" stroke="#38bdf8" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


