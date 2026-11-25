-- Wizard snooze and welcome progress.
--
-- Adds nullable columns only. Existing companies keep nulls until someone
-- uses the new wizard. No existing row values are rewritten.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS onboarding_dismissed_at timestamptz;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS onboarding_welcome_at timestamptz;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS onboarding_sample_text_at timestamptz;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS outing_style text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'companies_outing_style_check'
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_outing_style_check
      CHECK (outing_style IS NULL OR outing_style IN ('walk', 'hike'));
  END IF;
END $$;

COMMENT ON COLUMN public.companies.onboarding_dismissed_at IS
  'Skip for now. Separate from onboarding_completed_at so setup can resume.';
COMMENT ON COLUMN public.companies.onboarding_welcome_at IS
  'Set when the owner chooses cadence on the welcome step.';
COMMENT ON COLUMN public.companies.onboarding_sample_text_at IS
  'Set when the owner texts the sample reminder to their own phone.';
COMMENT ON COLUMN public.companies.outing_style IS
  'walk or hike. Copy only; it does not change routing.';
