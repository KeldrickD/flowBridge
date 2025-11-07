import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FlowBridge Dashboard",
  description: "Real-time view of on-chain settlements & off-chain reconciliation."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <div className="flex min-h-screen flex-col">{children}</div>
      </body>
    </html>
  );
}


