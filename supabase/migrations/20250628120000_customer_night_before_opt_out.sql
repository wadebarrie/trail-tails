-- Per-customer opt-out for night-before reminder texts (ETA/pickup texts unchanged).
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS night_before_reminders_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.customers.night_before_reminders_enabled IS
  'When false, skip ~6 PM night-before pickup reminder SMS. Customers can text STOP REMINDERS / START REMINDERS.';
