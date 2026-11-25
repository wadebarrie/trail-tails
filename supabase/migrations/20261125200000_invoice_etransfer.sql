-- Interac e-Transfer details and an unguessable public invoice link.
-- New columns only. No existing rows are updated.
-- show_card_payment defaults to false in the catalog so card pay stays off.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS etransfer_email text;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS etransfer_recipient_name text;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS etransfer_instructions text;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS show_card_payment boolean NOT NULL DEFAULT false;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS public_token text;

CREATE UNIQUE INDEX IF NOT EXISTS invoices_public_token_key
  ON public.invoices (public_token)
  WHERE public_token IS NOT NULL;

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'invoice';

COMMENT ON COLUMN public.companies.etransfer_email IS
  'Interac e-Transfer address shown on the public invoice.';
COMMENT ON COLUMN public.companies.show_card_payment IS
  'When true, and Stripe is configured, the public invoice can show a card pay link.';
COMMENT ON COLUMN public.invoices.public_token IS
  'Unguessable token for /i/{token}. Null until the invoice is shared.';
