-- Subscriptions: provider-agnostic SaaS billing (one subscription per company).

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------

CREATE TABLE public.subscriptions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id               uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan                     text NOT NULL DEFAULT 'starter',
  status                   text NOT NULL DEFAULT 'trial',
  trial_starts_at          timestamptz,
  trial_ends_at            timestamptz,
  started_at               timestamptz NOT NULL DEFAULT now(),
  cancelled_at             timestamptz,
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  billing_interval         text NOT NULL DEFAULT 'monthly',
  billing_currency         text NOT NULL DEFAULT 'USD',
  monthly_price            integer NOT NULL DEFAULT 0,
  grandfathered            boolean NOT NULL DEFAULT false,
  payment_provider         text,
  provider_customer_id     text,
  provider_subscription_id text,
  provider_price_id        text,
  notes                    text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT subscriptions_company_id_unique UNIQUE (company_id),
  CONSTRAINT subscriptions_monthly_price_nonneg CHECK (monthly_price >= 0),
  CONSTRAINT subscriptions_plan_check CHECK (
    plan IN ('beta_partner', 'starter', 'growth', 'enterprise')
  ),
  CONSTRAINT subscriptions_status_check CHECK (
    status IN ('trial', 'active', 'past_due', 'cancelled', 'paused', 'inactive')
  ),
  CONSTRAINT subscriptions_billing_interval_check CHECK (
    billing_interval IN ('monthly', 'yearly')
  ),
  CONSTRAINT subscriptions_billing_currency_check CHECK (
    billing_currency IN ('CAD', 'USD')
  ),
  CONSTRAINT subscriptions_payment_provider_check CHECK (
    payment_provider IS NULL OR payment_provider IN ('stripe')
  )
);

CREATE INDEX subscriptions_status_idx
  ON public.subscriptions (status);

CREATE INDEX subscriptions_plan_idx
  ON public.subscriptions (plan);

CREATE INDEX subscriptions_trial_ends_at_idx
  ON public.subscriptions (trial_ends_at)
  WHERE trial_ends_at IS NOT NULL;

CREATE INDEX subscriptions_current_period_end_idx
  ON public.subscriptions (current_period_end)
  WHERE current_period_end IS NOT NULL;

CREATE INDEX subscriptions_grandfathered_idx
  ON public.subscriptions (grandfathered)
  WHERE grandfathered = true;

CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.subscriptions IS
  'SaaS subscription for each company. Payment providers sync status and period fields here.';

COMMENT ON COLUMN public.subscriptions.monthly_price IS
  'Monthly amount in whole currency units (e.g. 49 for $49/mo). Not derived from plan name.';

COMMENT ON COLUMN public.subscriptions.grandfathered IS
  'When true, the company retains monthly_price regardless of catalog plan changes.';

COMMENT ON COLUMN public.subscriptions.payment_provider IS
  'External billing provider (e.g. stripe). Null until billing is connected.';

-- ---------------------------------------------------------------------------
-- Backfill from legacy companies billing columns
-- ---------------------------------------------------------------------------

INSERT INTO public.subscriptions (
  company_id,
  plan,
  status,
  trial_starts_at,
  trial_ends_at,
  started_at,
  cancelled_at,
  billing_interval,
  billing_currency,
  monthly_price,
  grandfathered
)
SELECT
  c.id,
  CASE c.plan_tier
    WHEN 'starter' THEN 'starter'
    WHEN 'growth' THEN 'growth'
    WHEN 'enterprise' THEN 'enterprise'
    ELSE 'starter'
  END,
  CASE
    WHEN c.plan_tier = 'trial' THEN 'trial'
    WHEN c.status = 'paused' THEN 'paused'
    WHEN c.status = 'churned' THEN 'cancelled'
    ELSE 'active'
  END,
  CASE
    WHEN c.plan_tier = 'trial' OR c.trial_ends_at IS NOT NULL THEN c.created_at
    ELSE NULL
  END,
  c.trial_ends_at,
  c.created_at,
  CASE WHEN c.status = 'churned' THEN c.updated_at ELSE NULL END,
  'monthly',
  'USD',
  CASE
    WHEN c.monthly_subscription_cents > 0 THEN c.monthly_subscription_cents / 100
    ELSE 0
  END,
  false
FROM public.companies c
ON CONFLICT (company_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Remove billing fields from companies (owned by subscriptions)
-- ---------------------------------------------------------------------------

ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_plan_tier_check;
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_status_check;

ALTER TABLE public.companies
  DROP COLUMN IF EXISTS plan_tier,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS monthly_subscription_cents,
  DROP COLUMN IF EXISTS trial_ends_at;

-- ---------------------------------------------------------------------------
-- Auto-create subscription when a company is created
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_default_subscription_for_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (
    company_id,
    plan,
    status,
    trial_starts_at,
    trial_ends_at,
    started_at,
    billing_interval,
    billing_currency,
    monthly_price
  )
  VALUES (
    NEW.id,
    'starter',
    'trial',
    now(),
    now() + interval '30 days',
    now(),
    'monthly',
    'USD',
    0
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER companies_create_default_subscription
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.create_default_subscription_for_company();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_owner_all ON public.subscriptions
  FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY subscriptions_admin_select ON public.subscriptions
  FOR SELECT
  USING (
    public.is_admin()
    AND company_id = public.user_company_id()
  );
