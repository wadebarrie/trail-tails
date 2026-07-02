import {
  BILLING_CURRENCIES,
  BILLING_INTERVALS,
  PAYMENT_PROVIDERS,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
} from "@/features/subscription/constants";

export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
export type BillingInterval = (typeof BILLING_INTERVALS)[number];
export type BillingCurrency = (typeof BILLING_CURRENCIES)[number];
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

/** Row shape for public.subscriptions. */
export type Subscription = {
  id: string;
  company_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trial_starts_at: string | null;
  trial_ends_at: string | null;
  started_at: string;
  cancelled_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  billing_interval: BillingInterval;
  billing_currency: BillingCurrency;
  monthly_price: number;
  grandfathered: boolean;
  payment_provider: PaymentProvider | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  provider_price_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

/** Minimum fields required by subscription helper functions. */
export type SubscriptionLike = Pick<
  Subscription,
  "status" | "trial_starts_at" | "trial_ends_at"
>;

export type SubscriptionSummary = Pick<
  Subscription,
  | "plan"
  | "status"
  | "trial_starts_at"
  | "trial_ends_at"
  | "monthly_price"
  | "billing_currency"
  | "billing_interval"
  | "grandfathered"
  | "current_period_start"
  | "current_period_end"
  | "cancelled_at"
>;
