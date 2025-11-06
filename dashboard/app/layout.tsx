import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowBridge Ops Dashboard",
  description: "Real-time observability for FlowBridge payments and settlements"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">{children}</body>
    </html>
  );
}


