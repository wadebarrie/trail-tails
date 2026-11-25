-- Optional inboxes for invoice email. New nullable columns only.
-- Existing rows are left as they are.
-- Apply later with supabase db push. Do not run from the app.

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS billing_email text;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS test_email text;

COMMENT ON COLUMN public.customers.billing_email IS
  'Invoice email. Falls back to customers.email when blank.';

COMMENT ON COLUMN public.companies.test_email IS
  'When sms_mode is test or unset, invoice email is redirected here. Blank skips the email.';
