-- Enable UUID generation (pgcrypto). If you prefer uuid-ossp, swap accordingly.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- payments table
CREATE TABLE IF NOT EXISTS payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_hash    TEXT UNIQUE NOT NULL,
    payer_address   TEXT NOT NULL,
    payee_address   TEXT NOT NULL,
    amount_wei      NUMERIC(78, 0) NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'fbUSD',
    status          TEXT NOT NULL CHECK (status IN ('pending', 'settled', 'failed')),
    latency_ms      INTEGER,
    offchain_ref    TEXT,
    tx_hash         TEXT,
    chain_id        INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payments_set_updated_at ON payments;
CREATE TRIGGER trg_payments_set_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION set_payments_updated_at();

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_created_at_desc
  ON payments (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_status_created_at
  ON payments (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_payer_created_at
  ON payments (payer_address, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_payee_created_at
  ON payments (payee_address, created_at DESC);

-- payment_events table
CREATE TABLE IF NOT EXISTS payment_events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id    UUID,
    event_type    TEXT NOT NULL,
    payload       JSONB,
    tx_hash       TEXT,
    block_number  INTEGER,
    source        TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_payment_events_payment
      FOREIGN KEY (payment_id) REFERENCES payments(id)
      ON DELETE SET NULL
);

-- Indexes for payment_events
CREATE INDEX IF NOT EXISTS idx_payment_events_created_at_desc
  ON payment_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_events_payment_id_created_at
  ON payment_events (payment_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_events_event_type_created_at
  ON payment_events (event_type, created_at DESC);


