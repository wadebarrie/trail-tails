-- Platform analytics: SaaS plan fields on companies + configurable cost assumptions.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS plan_tier text NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS monthly_subscription_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_plan_tier_check
  CHECK (plan_tier IN ('trial', 'starter', 'growth', 'enterprise'));

ALTER TABLE public.companies
  ADD CONSTRAINT companies_status_check
  CHECK (status IN ('active', 'paused', 'churned'));

CREATE TABLE public.platform_cost_assumptions (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sms_outbound_usd            numeric(10, 6) NOT NULL DEFAULT 0.0079,
  sms_inbound_usd             numeric(10, 6) NOT NULL DEFAULT 0.0079,
  eta_calculation_usd         numeric(10, 6) NOT NULL DEFAULT 0.005,
  geocode_usd                 numeric(10, 6) NOT NULL DEFAULT 0.005,
  base_infra_per_company_usd  numeric(10, 4) NOT NULL DEFAULT 2.00,
  supabase_platform_usd       numeric(10, 2) NOT NULL DEFAULT 25.00,
  netlify_platform_usd        numeric(10, 2) NOT NULL DEFAULT 19.00,
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- Singleton row with sensible defaults.
INSERT INTO public.platform_cost_assumptions (id)
VALUES ('b0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_cost_assumptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_cost_assumptions_owner_all ON public.platform_cost_assumptions
  FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

-- PackRoute demo company stays trial with no subscription.
UPDATE public.companies
SET plan_tier = 'trial',
    status = 'active',
    monthly_subscription_cents = 0
WHERE id = 'a0000000-0000-0000-0000-000000000001';
