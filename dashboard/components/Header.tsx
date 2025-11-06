export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/60 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-xl font-black tracking-tight">
            F
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">FlowBridge</h1>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                zkSync Testnet
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">Real-time view of on-chain settlements & off-chain reconciliation.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300">
            Status: <span className="font-medium text-emerald-400">Healthy</span>
          </span>
        </div>
      </div>
    </header>
  );
}


