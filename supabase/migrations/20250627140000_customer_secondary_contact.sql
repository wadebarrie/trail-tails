-- Optional second parent / contact on customer records
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS secondary_owner_name text,
  ADD COLUMN IF NOT EXISTS secondary_phone text;

ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_secondary_contact_pair_check;

ALTER TABLE public.customers
  ADD CONSTRAINT customers_secondary_contact_pair_check
  CHECK (
    (secondary_owner_name IS NULL AND secondary_phone IS NULL)
    OR (
      secondary_owner_name IS NOT NULL
      AND secondary_phone IS NOT NULL
      AND length(trim(secondary_owner_name)) > 0
      AND length(trim(secondary_phone)) > 0
    )
  );

CREATE INDEX IF NOT EXISTS customers_secondary_phone_idx
  ON public.customers (company_id, secondary_phone)
  WHERE secondary_phone IS NOT NULL;

COMMENT ON COLUMN public.customers.secondary_owner_name IS 'Second parent or contact name';
COMMENT ON COLUMN public.customers.secondary_phone IS 'Second parent phone; receives same SMS as primary';
