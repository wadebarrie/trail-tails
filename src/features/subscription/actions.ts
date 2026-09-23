"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/features/auth/queries";
import {
  areStripePricesConfigured,
  getPaidTier,
  getStripePriceId,
  isStripeBillingConfigured,
  type PaidTierId,
} from "@/features/subscription/stripe-prices";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createStripeClient, getStripeSecretKey } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site-url";
import type { BillingInterval } from "@/features/subscription/types";
import {
  applyStripeSubscriptionToCompany,
  syncCheckoutSessionToCompany,
} from "@/features/subscription/apply-stripe-subscription";

async function requireStripeAdmin() {
  const profile = await requireRole("admin", { skipMfaCheck: true });
  const secretKey = getStripeSecretKey();
  if (!secretKey || !isStripeBillingConfigured()) {
    return {
      profile,
      error: "Stripe billing is not configured yet. Contact PackRoute support.",
    } as const;
  }
  return { profile, stripe: createStripeClient(secretKey) } as const;
}

async function loadCompanySubscription(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, company_id, provider_customer_id, provider_subscription_id, status"
    )
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function ensureStripeCustomer(params: {
  stripe: ReturnType<typeof createStripeClient>;
  companyId: string;
  existingCustomerId: string | null;
  email: string | null;
  companyName: string;
}): Promise<{ customerId: string; error?: string }> {
  const { stripe, companyId, existingCustomerId, email, companyName } = params;

  if (existingCustomerId) {
    return { customerId: existingCustomerId };
  }

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    name: companyName,
    metadata: { company_id: companyId },
  });

  const service = createServiceClient();
  const { error } = await service
    .from("subscriptions")
    .update({
      provider_customer_id: customer.id,
      payment_provider: "stripe",
    })
    .eq("company_id", companyId);

  if (error) {
    return { customerId: customer.id, error: error.message };
  }

  return { customerId: customer.id };
}

export async function createCheckoutSessionAction(
  tierId: PaidTierId,
  interval: BillingInterval = "monthly"
): Promise<{ error?: string }> {
  const auth = await requireStripeAdmin();
  if ("error" in auth) return { error: auth.error };

  const { profile, stripe } = auth;
  const tier = getPaidTier(tierId);
  if (!tier) return { error: "Unknown plan." };

  const priceId = getStripePriceId(tierId, interval);
  if (!priceId) {
    return {
      error:
        interval === "yearly"
          ? "Yearly pricing is not configured yet. Choose monthly or contact support."
          : "Stripe prices are not configured. Contact PackRoute support.",
    };
  }

  if (interval === "monthly" && !areStripePricesConfigured("monthly")) {
    return {
      error: "Stripe prices are not fully configured. Contact PackRoute support.",
    };
  }

  const subscription = await loadCompanySubscription(profile.company_id);
  if (!subscription) {
    return { error: "No subscription record found for your company." };
  }

  const supabase = await createClient();
  const [{ data: company }, { data: userData }] = await Promise.all([
    supabase
      .from("companies")
      .select("name")
      .eq("id", profile.company_id)
      .single(),
    supabase.auth.getUser(),
  ]);

  const ensured = await ensureStripeCustomer({
    stripe,
    companyId: profile.company_id,
    existingCustomerId: subscription.provider_customer_id,
    email: userData.user?.email ?? null,
    companyName: company?.name ?? "PackRoute customer",
  });

  if (ensured.error) return { error: ensured.error };

  const siteUrl = getSiteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: ensured.customerId,
    client_reference_id: profile.company_id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/subscription-inactive?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/subscription-inactive?checkout=cancelled`,
    allow_promotion_codes: true,
    metadata: {
      company_id: profile.company_id,
      tier_id: tierId,
      billing_interval: interval,
    },
    subscription_data: {
      metadata: {
        company_id: profile.company_id,
        tier_id: tierId,
        billing_interval: interval,
      },
    },
  });

  if (!session.url) {
    return { error: "Could not start Stripe Checkout." };
  }

  redirect(session.url);
}

export async function createBillingPortalSessionAction(): Promise<{
  error?: string;
}> {
  const auth = await requireStripeAdmin();
  if ("error" in auth) return { error: auth.error };

  const { profile, stripe } = auth;
  const subscription = await loadCompanySubscription(profile.company_id);

  if (!subscription?.provider_customer_id) {
    return {
      error:
        "No Stripe customer on file yet. Subscribe to a plan first, then manage billing here.",
    };
  }

  const siteUrl = getSiteUrl();
  const portal = await stripe.billingPortal.sessions.create({
    customer: subscription.provider_customer_id,
    return_url: `${siteUrl}/dashboard/settings`,
  });

  if (!portal.url) {
    return { error: "Could not open the billing portal." };
  }

  redirect(portal.url);
}

/** After Checkout success, sync immediately in case the webhook is delayed. */
export async function finalizeCheckoutSessionAction(
  sessionId: string
): Promise<{ error?: string; ok?: boolean }> {
  const auth = await requireStripeAdmin();
  if ("error" in auth) return { error: auth.error };

  const { profile, stripe } = auth;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const metaCompanyId = session.metadata?.company_id;
    if (metaCompanyId && metaCompanyId !== profile.company_id) {
      return { error: "Checkout session does not belong to your company." };
    }

    const result = await syncCheckoutSessionToCompany(
      stripe,
      session,
      profile.company_id
    );

    if (!result.ok) return { error: result.error };
    return { ok: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not finalize checkout",
    };
  }
}

export async function applyStripeSubscriptionAction(
  stripeSubscriptionId: string
): Promise<{ error?: string; ok?: boolean }> {
  const auth = await requireStripeAdmin();
  if ("error" in auth) return { error: auth.error };

  const { profile, stripe } = auth;

  try {
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const result = await applyStripeSubscriptionToCompany(
      subscription,
      profile.company_id
    );
    if (!result.ok) return { error: result.error };
    return { ok: true };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Could not refresh subscription",
    };
  }
}
