-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- Accounts table: aggregate balances & diff
-- ==========================================
CREATE TABLE IF NOT EXISTS accounts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address             TEXT NOT NULL UNIQUE,
    balance_onchain     NUMERIC(78, 0) NOT NULL DEFAULT 0,
    balance_bank        NUMERIC(78, 0) NOT NULL DEFAULT 0,
    discrepancy         NUMERIC(78, 0) NOT NULL DEFAULT 0,
    last_recon_run_id   UUID,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_accounts_set_updated_at ON accounts;
CREATE TRIGGER trg_accounts_set_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE FUNCTION set_accounts_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_accounts_address
  ON accounts (address);

CREATE INDEX IF NOT EXISTS idx_accounts_discrepancy_desc
  ON accounts (discrepancy DESC);

CREATE INDEX IF NOT EXISTS idx_accounts_last_recon_run_id
  ON accounts (last_recon_run_id);

-- ==========================================
-- Reconciliation logs: per-run summaries
-- ==========================================
CREATE TABLE IF NOT EXISTS reconciliation_logs (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id                    UUID NOT NULL,
    total_tx                  INTEGER NOT NULL,
    mismatched_tx             INTEGER NOT NULL DEFAULT 0,
    total_discrepancy_usd     NUMERIC(20, 4) NOT NULL DEFAULT 0,
    ai_summary                TEXT,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_logs_created_at_desc
  ON reconciliation_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reconciliation_logs_run_id
  ON reconciliation_logs (run_id);


