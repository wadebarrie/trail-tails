import { ManageBillingButton } from "@/features/subscription/components/manage-billing-button";
import { SubscribeTierButtons } from "@/features/subscription/components/subscribe-tier-buttons";
import {
  areStripePricesConfigured,
  isStripeBillingConfigured,
} from "@/features/subscription/stripe-prices";
import {
  daysRemainingInTrial,
  subscriptionPlanLabel,
} from "@/features/subscription/helpers";
import type { Subscription } from "@/features/subscription/types";

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export function CompanyBillingCard({
  subscription,
}: {
  subscription: Subscription | null;
}) {
  const billingReady =
    isStripeBillingConfigured() && areStripePricesConfigured("monthly");
  const disabledReason = !billingReady
    ? "Stripe billing is not configured in this environment yet."
    : null;

  const trialDays =
    subscription && subscription.status === "trial"
      ? daysRemainingInTrial(subscription)
      : null;

  return (
    <section className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-stone-900">Billing</h2>
      <p className="mt-1 text-sm text-stone-500">
        Manage your PackRoute plan. Capacity is by drivers and active dogs.
      </p>

      {subscription ? (
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">Plan</dt>
            <dd className="font-medium text-stone-900">
              {subscriptionPlanLabel(subscription.plan)}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Status</dt>
            <dd className="font-medium capitalize text-stone-900">
              {statusLabel(subscription.status)}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Price</dt>
            <dd className="font-medium text-stone-900">
              ${subscription.monthly_price}/{subscription.billing_interval === "yearly" ? "mo billed yearly" : "mo"}
            </dd>
          </div>
          {trialDays != null ? (
            <div>
              <dt className="text-stone-500">Trial</dt>
              <dd className="font-medium text-stone-900">
                {trialDays < 0
                  ? "Expired"
                  : trialDays === 0
                    ? "Ends today"
                    : `${trialDays} day${trialDays === 1 ? "" : "s"} left`}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="mt-4 text-sm text-amber-800">
          No subscription record found for this company.
        </p>
      )}

      <div className="mt-6 space-y-6 border-t border-stone-100 pt-6">
        <div>
          <h3 className="text-sm font-medium text-stone-800">
            {subscription?.status === "active" ? "Change plan" : "Subscribe"}
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            Opens Stripe Checkout. Existing subscribers can also manage payment
            methods in the billing portal.
          </p>
          <div className="mt-3">
            <SubscribeTierButtons disabledReason={disabledReason} />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-stone-800">Billing portal</h3>
          <p className="mt-1 text-xs text-stone-500">
            Update card, download invoices, or cancel.
          </p>
          <div className="mt-3">
            <ManageBillingButton disabledReason={disabledReason} />
          </div>
        </div>
      </div>
    </section>
  );
}
