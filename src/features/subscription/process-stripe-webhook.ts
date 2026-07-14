import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import {
  mapStripeSubscriptionStatus,
  stripeUnixToIso,
} from "@/features/subscription/stripe-map";

export type StripeWebhookResult =
  | { ok: true; action: "updated" | "ignored" | "duplicate" }
  | { ok: false; error: string; permanent?: boolean };

/** Insert event id first — unique constraint makes retries idempotent. */
export async function claimStripeWebhookEvent(
  eventId: string,
  eventType: string,
): Promise<"claimed" | "duplicate" | "error"> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("stripe_webhook_events").insert({
    event_id: eventId,
    event_type: eventType,
  });

  if (!error) return "claimed";
  if (error.code === "23505") return "duplicate";
  return "error";
}

type SubscriptionPatch = {
  status: ReturnType<typeof mapStripeSubscriptionStatus>;
  current_period_start: string | null;
  current_period_end: string | null;
  provider_customer_id: string;
  provider_subscription_id: string;
  provider_price_id: string | null;
  payment_provider: "stripe";
  cancelled_at: string | null;
};

function buildPatch(stripeSubscription: Stripe.Subscription): SubscriptionPatch {
  const customerId =
    typeof stripeSubscription.customer === "string"
      ? stripeSubscription.customer
      : stripeSubscription.customer?.id ?? "";

  return {
    status: mapStripeSubscriptionStatus(stripeSubscription.status),
    current_period_start: stripeUnixToIso(stripeSubscription.current_period_start),
    current_period_end: stripeUnixToIso(stripeSubscription.current_period_end),
    provider_customer_id: customerId,
    provider_subscription_id: stripeSubscription.id,
    provider_price_id: stripeSubscription.items.data[0]?.price?.id ?? null,
    payment_provider: "stripe",
    cancelled_at: stripeUnixToIso(stripeSubscription.canceled_at),
  };
}

async function updateSubscription(
  filter: { column: "company_id" | "provider_subscription_id" | "provider_customer_id"; value: string },
  patch: Partial<SubscriptionPatch> & Pick<SubscriptionPatch, "status">
): Promise<StripeWebhookResult> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .update(patch)
    .eq(filter.column, filter.value)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) {
    return { ok: false, error: "subscription_not_found", permanent: true };
  }
  return { ok: true, action: "updated" };
}

export async function syncSubscriptionFromStripeEvent(
  event: Stripe.Event
): Promise<StripeWebhookResult> {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const patch = buildPatch(subscription);
      const companyId = subscription.metadata?.company_id;

      if (companyId) {
        return updateSubscription({ column: "company_id", value: companyId }, patch);
      }

      const byProvider = await updateSubscription(
        { column: "provider_subscription_id", value: subscription.id },
        patch
      );
      if (byProvider.ok) return byProvider;

      if (patch.provider_customer_id) {
        return updateSubscription(
          { column: "provider_customer_id", value: patch.provider_customer_id },
          patch
        );
      }

      return {
        ok: false,
        error: "subscription_not_found",
        permanent: true,
      };
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const patch = buildPatch(subscription);
      patch.status = "cancelled";
      patch.cancelled_at = patch.cancelled_at ?? new Date().toISOString();

      const companyId = subscription.metadata?.company_id;
      if (companyId) {
        return updateSubscription({ column: "company_id", value: companyId }, patch);
      }

      return updateSubscription(
        { column: "provider_subscription_id", value: subscription.id },
        patch
      );
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

      if (!customerId) {
        return { ok: true, action: "ignored" };
      }

      return updateSubscription(
        { column: "provider_customer_id", value: customerId },
        {
          status: "past_due",
          current_period_end: stripeUnixToIso(invoice.period_end),
        }
      );
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

      if (!customerId) {
        return { ok: true, action: "ignored" };
      }

      return updateSubscription(
        { column: "provider_customer_id", value: customerId },
        {
          status: "active",
          current_period_end: stripeUnixToIso(invoice.period_end),
        }
      );
    }

    default:
      return { ok: true, action: "ignored" };
  }
}
