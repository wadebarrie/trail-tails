-- Idempotent Stripe webhook processing (service role only).

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed_at
  ON stripe_webhook_events (processed_at DESC);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (bypasses RLS) may read/write.

COMMENT ON TABLE stripe_webhook_events IS
  'Deduplicates Stripe webhook deliveries; populated by /api/webhooks/stripe.';
