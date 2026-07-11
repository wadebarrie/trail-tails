-- Platform-wide onboarding controls (singleton row).

CREATE TABLE public.platform_settings (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  invites_enabled boolean     NOT NULL DEFAULT true,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.platform_settings (id, invites_enabled)
VALUES ('c0000000-0000-0000-0000-000000000001', true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_settings_owner_all ON public.platform_settings
  FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

COMMENT ON TABLE public.platform_settings IS
  'Singleton platform controls — invites_enabled gates new company signup.';

COMMENT ON COLUMN public.platform_settings.invites_enabled IS
  'When false, owners cannot create invites and invite links cannot be accepted.';
