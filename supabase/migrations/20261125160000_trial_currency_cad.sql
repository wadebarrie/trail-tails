-- New trials are priced in CAD. Existing unpaid trial rows that were stored
-- as USD are updated to CAD. Paid subscriptions are left unchanged.
-- Safe to run more than once.

ALTER TABLE public.subscriptions
  ALTER COLUMN billing_currency SET DEFAULT 'CAD';

UPDATE public.subscriptions
SET billing_currency = 'CAD'
WHERE status = 'trial'
  AND monthly_price = 0
  AND billing_currency IS DISTINCT FROM 'CAD';

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
    'CAD',
    0
  );
  RETURN NEW;
END;
$$;
