-- Platform owner flag, beta company invites, and owner RLS.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_platform_owner boolean NOT NULL DEFAULT false;

CREATE TABLE public.company_invites (
  id           uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid                    NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  email        text                    NOT NULL,
  token_hash   text                    NOT NULL UNIQUE,
  role         public.user_role        NOT NULL DEFAULT 'admin',
  full_name    text,
  expires_at   timestamptz             NOT NULL,
  accepted_at  timestamptz,
  accepted_by  uuid                    REFERENCES auth.users (id) ON DELETE SET NULL,
  created_by   uuid                    REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at   timestamptz             NOT NULL DEFAULT now(),
  CHECK (role = 'admin'::public.user_role)
);

CREATE INDEX company_invites_company_idx
  ON public.company_invites (company_id, created_at DESC);

CREATE INDEX company_invites_email_idx
  ON public.company_invites (lower(email));

ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_platform_owner = true
      AND is_active = true
  );
$$;

CREATE POLICY companies_platform_owner_select ON public.companies
  FOR SELECT
  USING (public.is_platform_owner());

CREATE POLICY companies_platform_owner_insert ON public.companies
  FOR INSERT
  WITH CHECK (public.is_platform_owner());

CREATE POLICY companies_platform_owner_update ON public.companies
  FOR UPDATE
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY company_invites_platform_owner_all ON public.company_invites
  FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

-- Dev/test platform owner (no-op if user does not exist yet).
UPDATE public.profiles
SET is_platform_owner = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@trailtails.test'
);
