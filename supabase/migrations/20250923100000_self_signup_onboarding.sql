-- Self-serve signup + first-run onboarding tracking.

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS self_signup_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.platform_settings.self_signup_enabled IS
  'When true, /signup without an invite token allows creating a company + admin (trial). Invite flow still uses invites_enabled.';

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

COMMENT ON COLUMN public.companies.onboarding_completed_at IS
  'Set when the admin finishes or dismisses the first-run setup wizard. NULL means guide them through onboarding.';

-- Existing tenants should not be forced into the new wizard.
UPDATE public.companies
SET onboarding_completed_at = created_at
WHERE onboarding_completed_at IS NULL;
