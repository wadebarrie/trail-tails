/** Application subscription plans — stored as text, not PostgreSQL enums. */
export const SUBSCRIPTION_PLANS = [
  "beta_partner",
  "starter",
  "growth",
  "enterprise",
] as const;

/** Application subscription statuses — not Stripe status names. */
export const SUBSCRIPTION_STATUSES = [
  "trial",
  "active",
  "past_due",
  "cancelled",
  "paused",
  "inactive",
] as const;

export const BILLING_INTERVALS = ["monthly", "yearly"] as const;

export const BILLING_CURRENCIES = ["CAD", "USD"] as const;

export const PAYMENT_PROVIDERS = ["stripe"] as const;

/** Default trial length when provisioning a new company (stored as fixed dates). */
export const DEFAULT_TRIAL_DAYS = 30;
