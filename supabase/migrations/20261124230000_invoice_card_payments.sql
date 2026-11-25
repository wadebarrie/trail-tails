-- Online CAD card pay for customer invoices (Stripe Checkout → payments.method = card).

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_method_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_method_check
  CHECK (method IN ('e_transfer', 'cash', 'card', 'other'));

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_pay_url text;

CREATE UNIQUE INDEX IF NOT EXISTS invoices_stripe_checkout_session_id_key
  ON public.invoices (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

-- Idempotent webhook posts: one payment row per Checkout session id.
CREATE UNIQUE INDEX IF NOT EXISTS payments_invoice_reference_key
  ON public.payments (invoice_id, reference)
  WHERE reference IS NOT NULL;
