-- Structured customer address fields (keep `address` as composed display/geocode string).

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state_province text,
  ADD COLUMN IF NOT EXISTS postal_code text;

-- Best-effort backfill: put freeform address into line1 until edited.
UPDATE public.customers
SET address_line1 = address
WHERE address_line1 IS NULL
  AND address IS NOT NULL
  AND btrim(address) <> '';
