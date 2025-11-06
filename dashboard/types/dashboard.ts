export type PaymentStatus = "settled" | "pending" | "failed";

export type DashboardStats = {
  totalPayments24h: number;
  settlementSuccessRate: number;
  failedPayments24h: number;
  avgSettlementLatencyMs: number;
  p95SettlementLatencyMs: number;
  ledgerDiscrepancies: number;
  ledgerDiscrepanciesOver1Usd: number;
};

export type DashboardPayment = {
  id: string;
  paymentHash: string;
  payerAddress: string;
  payeeAddress: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  latencyMs: number | null;
  offchainRef: string;
  createdAt: string;
};

export type ServiceStatus = "healthy" | "degraded" | "down";

export type DashboardService = {
  name: string;
  key: string;
  status: ServiceStatus;
  latencyMs: number;
};

export type DashboardEvent = {
  time: string;
  type: string;
  description: string;
};

export type DemoApiResponse = {
  stats: DashboardStats;
  payments: DashboardPayment[];
  services: DashboardService[];
  events: DashboardEvent[];
};

export type ReconciliationRun = {
  id: string;
  runId: string;
  totalTx: number;
  mismatchedTx: number;
  totalDiscrepancyUsd: number;
  aiSummary: string | null;
  createdAt: string;
};


