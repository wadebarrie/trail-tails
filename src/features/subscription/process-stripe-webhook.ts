import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { patchFromStripeSubscription } from "@/features/subscription/apply-stripe-subscription";
import { stripeUnixToIso } from "@/features/subscription/stripe-map";
import { createStripeClient, getStripeSecretKey } from "@/lib/stripe";

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

/** Release a claim so Stripe retries can reprocess after a transient failure. */
export async function releaseStripeWebhookEvent(eventId: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("stripe_webhook_events").delete().eq("event_id", eventId);
}

type SubscriptionPatch = ReturnType<typeof patchFromStripeSubscription>;

async function updateSubscription(
  filter: {
    column: "company_id" | "provider_subscription_id" | "provider_customer_id";
    value: string;
  },
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

async function updateBySubscriptionIdentity(
  subscription: Stripe.Subscription,
  patch: SubscriptionPatch
): Promise<StripeWebhookResult> {
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

export async function syncSubscriptionFromStripeEvent(
  event: Stripe.Event
): Promise<StripeWebhookResult> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") {
        return { ok: true, action: "ignored" };
      }

      const companyId =
        session.metadata?.company_id || session.client_reference_id || null;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (!companyId || !subscriptionId) {
        return {
          ok: false,
          error: "checkout_missing_company_or_subscription",
          permanent: true,
        };
      }

      const secretKey = getStripeSecretKey();
      if (!secretKey) {
        return { ok: false, error: "stripe_not_configured" };
      }

      const stripe = createStripeClient(secretKey);
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const patch = patchFromStripeSubscription(subscription);

      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;
      if (customerId) {
        patch.provider_customer_id = customerId;
      }

      return updateSubscription({ column: "company_id", value: companyId }, patch);
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const patch = patchFromStripeSubscription(subscription);
      return updateBySubscriptionIdentity(subscription, patch);
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const patch = patchFromStripeSubscription(subscription);
      patch.status = "cancelled";
      patch.cancelled_at = patch.cancelled_at ?? new Date().toISOString();
      return updateBySubscriptionIdentity(subscription, patch);
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
