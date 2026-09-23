-- Allow paid hiker tiers used by Stripe Checkout / marketing pricing.

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_check CHECK (
    plan IN (
      'beta_partner',
      'one_hiker',
      'two_hikers',
      'three_plus',
      'starter',
      'growth',
      'enterprise'
    )
  );
