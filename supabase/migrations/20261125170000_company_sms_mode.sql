-- Per-company SMS test mode and a normalized phone key for inbound routing.
--
-- This migration UPDATES one existing row: the Trail Tails seed company
-- (a0000000-0000-0000-0000-000000000001) is set to sms_mode = 'test' so
-- removing the global prod redirect does not text that company's sample
-- customers. Every other existing company stays live.
-- Safe to re-run the privilege and comment statements. The column adds
-- are guarded. The seed update is idempotent.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS sms_mode text NOT NULL DEFAULT 'live';

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS sms_test_phone text;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS sms_live_approved boolean NOT NULL DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'companies_sms_mode_check'
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_sms_mode_check
      CHECK (sms_mode IN ('test', 'live'));
  END IF;
END $$;

UPDATE public.companies
SET sms_mode = 'test'
WHERE id = 'a0000000-0000-0000-0000-000000000001'
  AND sms_mode IS DISTINCT FROM 'test';

CREATE OR REPLACE FUNCTION public.phone_match_key(raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN pg_catalog.length(digits) >= 10 THEN pg_catalog.right(digits, 10)
    ELSE pg_catalog.nullif(digits, '')
  END
  FROM (
    SELECT pg_catalog.regexp_replace(pg_catalog.coalesce(raw, ''), '[^0-9]', '', 'g') AS digits
  ) s;
$$;

REVOKE ALL ON FUNCTION public.phone_match_key(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.phone_match_key(text) TO authenticated, service_role;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS phone_key text
  GENERATED ALWAYS AS (public.phone_match_key(phone)) STORED;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS secondary_phone_key text
  GENERATED ALWAYS AS (public.phone_match_key(secondary_phone)) STORED;

ALTER TABLE public.sms_messages
  ADD COLUMN IF NOT EXISTS to_phone_key text
  GENERATED ALWAYS AS (
    CASE
      WHEN direction = 'outbound'::public.sms_direction
        THEN public.phone_match_key(to_number)
      ELSE NULL
    END
  ) STORED;

CREATE INDEX IF NOT EXISTS customers_phone_key_idx
  ON public.customers (phone_key);

CREATE INDEX IF NOT EXISTS customers_secondary_phone_key_idx
  ON public.customers (secondary_phone_key);

CREATE INDEX IF NOT EXISTS sms_messages_outbound_to_phone_idx
  ON public.sms_messages (to_phone_key, created_at DESC);

COMMENT ON COLUMN public.companies.sms_mode IS
  'test sends every text to sms_test_phone. live texts each customer.';
COMMENT ON COLUMN public.companies.sms_live_approved IS
  'Self-serve companies stay in test mode until PackRoute sets this true.';
