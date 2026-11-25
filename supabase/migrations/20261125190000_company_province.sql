-- Optional province for later GST/HST. Nullable column only.
-- Existing company rows are not rewritten.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS province text;

COMMENT ON COLUMN public.companies.province IS
  'Canadian province or territory, collected at signup for later tax.';
