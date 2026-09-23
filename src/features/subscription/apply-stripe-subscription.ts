import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import {
  mapStripeSubscriptionStatus,
  stripeUnixToIso,
} from "@/features/subscription/stripe-map";
import { resolveTierFromStripePriceId } from "@/features/subscription/stripe-prices";
import type { BillingInterval } from "@/features/subscription/types";

export type ApplyStripeResult =
  | { ok: true }
  | { ok: false; error: string };

function billingIntervalFromPrice(
  price: Stripe.Price | string | null | undefined
): BillingInterval {
  if (!price || typeof price === "string") return "monthly";
  return price.recurring?.interval === "year" ? "yearly" : "monthly";
}

/** Build DB patch from a Stripe Subscription object. */
export function patchFromStripeSubscription(stripeSubscription: Stripe.Subscription) {
  const customerId =
    typeof stripeSubscription.customer === "string"
      ? stripeSubscription.customer
      : stripeSubscription.customer?.id ?? "";

  const priceItem = stripeSubscription.items.data[0]?.price;
  const priceId = typeof priceItem === "string" ? priceItem : priceItem?.id ?? null;
  const tier = resolveTierFromStripePriceId(priceId);
  const interval = billingIntervalFromPrice(
    typeof priceItem === "string" ? null : priceItem
  );

  return {
    status: mapStripeSubscriptionStatus(stripeSubscription.status),
    current_period_start: stripeUnixToIso(stripeSubscription.current_period_start),
    current_period_end: stripeUnixToIso(stripeSubscription.current_period_end),
    provider_customer_id: customerId,
    provider_subscription_id: stripeSubscription.id,
    provider_price_id: priceId,
    payment_provider: "stripe" as const,
    cancelled_at: stripeUnixToIso(stripeSubscription.canceled_at),
    billing_interval: interval,
    ...(tier
      ? {
          plan: tier.plan,
          monthly_price: tier.monthlyPriceUsd,
          billing_currency: "USD" as const,
        }
      : {}),
  };
}

export async function applyStripeSubscriptionToCompany(
  stripeSubscription: Stripe.Subscription,
  companyId: string
): Promise<ApplyStripeResult> {
  const supabase = createServiceClient();
  const patch = patchFromStripeSubscription(stripeSubscription);

  const { data, error } = await supabase
    .from("subscriptions")
    .update(patch)
    .eq("company_id", companyId)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "subscription_not_found" };
  return { ok: true };
}

export async function syncCheckoutSessionToCompany(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  companyId: string
): Promise<ApplyStripeResult> {
  if (session.mode !== "subscription") {
    return { ok: false, error: "Not a subscription checkout session" };
  }

  const subscriptionRef = session.subscription;
  const subscriptionId =
    typeof subscriptionRef === "string"
      ? subscriptionRef
      : subscriptionRef?.id;

  if (!subscriptionId) {
    return { ok: false, error: "Checkout session has no subscription yet" };
  }

  const stripeSubscription =
    typeof subscriptionRef === "object" && subscriptionRef && "status" in subscriptionRef
      ? (subscriptionRef as Stripe.Subscription)
      : await stripe.subscriptions.retrieve(subscriptionId);

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  const result = await applyStripeSubscriptionToCompany(
    stripeSubscription,
    companyId
  );

  if (!result.ok) return result;

  if (customerId) {
    const supabase = createServiceClient();
    await supabase
      .from("subscriptions")
      .update({ provider_customer_id: customerId, payment_provider: "stripe" })
      .eq("company_id", companyId);
  }

  return { ok: true };
}
