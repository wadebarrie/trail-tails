-- Hold self-serve signup details until the email is confirmed.
-- No company or profile is created from this table until
-- public.provision_self_signup runs for a confirmed auth user.
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS public.pending_self_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  company_name text NOT NULL,
  timezone text NOT NULL,
  full_name text NOT NULL,
  auth_user_id uuid UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  company_id uuid REFERENCES public.companies (id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS pending_self_signups_open_email_idx
  ON public.pending_self_signups (lower(email))
  WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS pending_self_signups_auth_user_idx
  ON public.pending_self_signups (auth_user_id);

CREATE TABLE IF NOT EXISTS public.self_signup_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bucket text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS self_signup_attempts_bucket_created_idx
  ON public.self_signup_attempts (bucket, created_at DESC);

ALTER TABLE public.pending_self_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.self_signup_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.pending_self_signups FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.self_signup_attempts FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.pending_self_signups TO service_role;
GRANT ALL ON TABLE public.self_signup_attempts TO service_role;

CREATE OR REPLACE FUNCTION public.provision_self_signup(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending public.pending_self_signups%ROWTYPE;
  new_company uuid;
BEGIN
  -- Unconfirmed addresses never own a company, even if this RPC is called early.
  IF NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = p_user_id
      AND email_confirmed_at IS NOT NULL
  ) THEN
    RETURN NULL;
  END IF;

  SELECT *
  INTO pending
  FROM public.pending_self_signups
  WHERE auth_user_id = p_user_id
    AND consumed_at IS NULL
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    UPDATE public.pending_self_signups
    SET consumed_at = now()
    WHERE id = pending.id
      AND consumed_at IS NULL;
    RETURN (
      SELECT company_id FROM public.profiles WHERE id = p_user_id
    );
  END IF;

  INSERT INTO public.companies (name, timezone, onboarding_completed_at)
  VALUES (pending.company_name, pending.timezone, NULL)
  RETURNING id INTO new_company;

  INSERT INTO public.profiles (id, company_id, role, full_name, can_drive)
  VALUES (
    p_user_id,
    new_company,
    'admin'::public.user_role,
    pending.full_name,
    true
  );

  UPDATE public.pending_self_signups
  SET consumed_at = now(),
      company_id = new_company
  WHERE id = pending.id;

  RETURN new_company;
END;
$$;

REVOKE ALL ON FUNCTION public.provision_self_signup(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_self_signup(uuid) TO service_role;
