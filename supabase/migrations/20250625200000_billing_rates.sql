-- Phase B: optional per-hike rates for billing CSV totals
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS default_hike_rate_cents integer
  CHECK (default_hike_rate_cents IS NULL OR default_hike_rate_cents >= 0);

ALTER TABLE public.dogs
  ADD COLUMN IF NOT EXISTS hike_rate_cents integer
  CHECK (hike_rate_cents IS NULL OR hike_rate_cents >= 0);

COMMENT ON COLUMN public.companies.default_hike_rate_cents IS 'Default per-hike charge in cents (USD)';
COMMENT ON COLUMN public.dogs.hike_rate_cents IS 'Per-dog hike rate override in cents; falls back to company default';

-- Default $60.00 per hike for existing companies (adjust in DB or per-dog as needed)
UPDATE public.companies
SET default_hike_rate_cents = 6000
WHERE default_hike_rate_cents IS NULL;
