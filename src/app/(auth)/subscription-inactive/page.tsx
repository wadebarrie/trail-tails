import Link from "next/link";
import { AUTH_ROUTES } from "@/features/auth/constants";
import { getCurrentProfile } from "@/features/auth/queries";
import { SITE_CONTACT_EMAIL } from "@/lib/seo/metadata";
import { SubscribeTierButtons } from "@/features/subscription/components/subscribe-tier-buttons";
import { CheckoutSuccessSync } from "@/features/subscription/components/checkout-success-sync";
import {
  areStripePricesConfigured,
  isStripeBillingConfigured,
} from "@/features/subscription/stripe-prices";

type SearchParams = Promise<{
  checkout?: string;
  session_id?: string;
}>;

export default async function SubscriptionInactivePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";
  const billingReady =
    isStripeBillingConfigured() && areStripePricesConfigured("monthly");
  const disabledReason = !billingReady
    ? "Online checkout is not available yet. Contact us to reactivate your account."
    : !isAdmin
      ? "Ask a company admin to subscribe, or contact PackRoute support."
      : null;

  return (
    <div className="w-full max-w-3xl">
      <h1 className="text-2xl font-semibold text-[var(--color-trail-800)]">
        Subscription inactive
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-600">
        Your company&apos;s PackRoute subscription is not active. Team members
        cannot use the dashboard or driver app until billing is restored.
      </p>

      {params.checkout === "success" && params.session_id && isAdmin ? (
        <CheckoutSuccessSync sessionId={params.session_id} />
      ) : null}

      {params.checkout === "cancelled" ? (
        <p className="mt-4 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600">
          Checkout cancelled — pick a plan below when you&apos;re ready.
        </p>
      ) : null}

      {isAdmin ? (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-stone-900">
            Choose a plan
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Beta pricing by hikers and dogs. Subscribe to restore access.
          </p>
          <div className="mt-4">
            <SubscribeTierButtons disabledReason={disabledReason} />
          </div>
        </div>
      ) : null}

      <p className="mt-8 text-sm text-stone-600">
        Need help? Contact us at{" "}
        <a
          href={`mailto:${SITE_CONTACT_EMAIL}`}
          className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
        >
          {SITE_CONTACT_EMAIL}
        </a>{" "}
        or use the{" "}
        <Link
          href="/contact"
          className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
        >
          contact form
        </Link>
        .
      </p>
      <Link
        href={AUTH_ROUTES.login}
        className="mt-6 inline-flex text-sm font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
      >
        Back to sign in
      </Link>
    </div>
  );
}
