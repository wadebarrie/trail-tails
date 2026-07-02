-- Performance indexes for common query patterns

-- Inbound SMS: lookup by phone without company_id
CREATE INDEX IF NOT EXISTS customers_phone_active_idx
  ON public.customers (phone)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS customers_secondary_phone_active_idx
  ON public.customers (secondary_phone)
  WHERE is_active = true AND secondary_phone IS NOT NULL;

-- Night-before cron idempotency checks
CREATE INDEX IF NOT EXISTS notification_log_night_before_idx
  ON public.notification_log (company_id, customer_id, notification_type, created_at DESC);

-- Close-out query: open hikes before a date
CREATE INDEX IF NOT EXISTS hikes_company_status_date_idx
  ON public.hikes (company_id, status, date);

-- Stop sync and briefing: active dogs on routes
CREATE INDEX IF NOT EXISTS dogs_company_route_active_idx
  ON public.dogs (company_id, route_id, is_active);

-- Briefing late-pickup lookups
CREATE INDEX IF NOT EXISTS pending_requests_company_customer_status_idx
  ON public.pending_requests (company_id, customer_id, status);
