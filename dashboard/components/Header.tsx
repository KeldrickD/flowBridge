"use client";

const NETWORK_LABEL = "zkSync Testnet";
const ENV_LABEL = process.env.NEXT_PUBLIC_BASE_URL?.includes("localhost") ? "Local Dev" : "Remote API";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-lg font-bold text-cyan-400">F</div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-50 md:text-base">FlowBridge</span>
            <span className="text-[11px] text-slate-400">Real-time view of on-chain settlements &amp; off-chain reconciliation.</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="rounded-full bg-slate-900 px-2 py-1 font-medium text-cyan-300">{NETWORK_LABEL}</span>
          <span className="hidden rounded-full bg-slate-900 px-2 py-1 text-slate-400 md:inline">{ENV_LABEL}</span>
        </div>
      </div>
    </header>
  );
}


