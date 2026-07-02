-- Founder dashboard: company profiles, operational review snapshots, time-saved assumptions.

-- ---------------------------------------------------------------------------
-- Per-company founder metadata (notes, follow-up, case study tracking)
-- ---------------------------------------------------------------------------

CREATE TABLE public.company_founder_profiles (
  company_id         uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  internal_notes     text,
  follow_up_date     date,
  case_study_status  text NOT NULL DEFAULT 'none',
  customer_quote     text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT company_founder_profiles_case_study_status_check CHECK (
    case_study_status IN ('none', 'candidate', 'in_progress', 'published')
  )
);

CREATE INDEX company_founder_profiles_follow_up_date_idx
  ON public.company_founder_profiles (follow_up_date)
  WHERE follow_up_date IS NOT NULL;

CREATE INDEX company_founder_profiles_case_study_status_idx
  ON public.company_founder_profiles (case_study_status)
  WHERE case_study_status <> 'none';

CREATE TRIGGER company_founder_profiles_set_updated_at
  BEFORE UPDATE ON public.company_founder_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Time-saved assumptions (editable; used for operational reviews)
-- ---------------------------------------------------------------------------

ALTER TABLE public.platform_cost_assumptions
  ADD COLUMN IF NOT EXISTS minutes_per_eta_notification numeric(8, 2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS minutes_per_sms_request numeric(8, 2) NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS minutes_per_route_created numeric(8, 2) NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS minutes_per_billing_export numeric(8, 2) NOT NULL DEFAULT 30;

COMMENT ON COLUMN public.platform_cost_assumptions.minutes_per_eta_notification IS
  'Estimated office minutes saved per automated ETA/update notification.';

-- ---------------------------------------------------------------------------
-- Monthly operational review snapshots (immutable month reports)
-- ---------------------------------------------------------------------------

CREATE TABLE public.operational_reviews (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  review_month            date NOT NULL,
  metrics                 jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary                 text,
  value_delivered         text,
  operational_highlights  text,
  issues                  text,
  feature_requests        text,
  case_study_readiness    text,
  customer_quote          text,
  internal_notes          text,
  status                  text NOT NULL DEFAULT 'draft',
  reviewed_at             timestamptz,
  sent_at                 timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT operational_reviews_company_month_unique UNIQUE (company_id, review_month),
  CONSTRAINT operational_reviews_status_check CHECK (
    status IN ('draft', 'reviewed', 'sent')
  )
);

CREATE INDEX operational_reviews_company_id_idx
  ON public.operational_reviews (company_id, review_month DESC);

CREATE INDEX operational_reviews_status_idx
  ON public.operational_reviews (status);

CREATE TRIGGER operational_reviews_set_updated_at
  BEFORE UPDATE ON public.operational_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — platform owner only
-- ---------------------------------------------------------------------------

ALTER TABLE public.company_founder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_founder_profiles_owner_all ON public.company_founder_profiles
  FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY operational_reviews_owner_all ON public.operational_reviews
  FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

-- Seed founder profiles for existing companies
INSERT INTO public.company_founder_profiles (company_id)
SELECT id FROM public.companies
ON CONFLICT (company_id) DO NOTHING;
