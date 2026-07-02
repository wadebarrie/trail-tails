"use client";

import { useActionState } from "react";
import { updateCompanyPlanAction } from "@/features/platform/analytics/actions";
import { SubmitButton } from "@/features/admin/components/ui";
import type { CompanyDetailMetrics } from "@/features/platform/analytics/types";
import {
  BILLING_CURRENCIES,
  BILLING_INTERVALS,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
} from "@/features/subscription/constants";

export function CompanyPlanForm({ company }: { company: CompanyDetailMetrics }) {
  const [state, formAction, pending] = useActionState(updateCompanyPlanAction, {
    ok: false as const,
    error: "",
  });

  const trialEndsDefault = company.trialEndsAt
    ? company.trialEndsAt.slice(0, 10)
    : "";

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-stone-200 bg-white p-6"
    >
      <h2 className="text-lg font-semibold text-stone-900">Subscription</h2>
      <input type="hidden" name="company_id" value={company.id} />

      {state.ok ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Subscription updated.
        </p>
      ) : null}
      {!state.ok && "error" in state && state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor="plan" className="block text-sm font-medium text-stone-700">
          Plan
        </label>
        <select
          id="plan"
          name="plan"
          defaultValue={company.plan}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
        >
          {SUBSCRIPTION_PLANS.map((plan) => (
            <option key={plan} value={plan}>
              {plan.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-stone-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={company.subscriptionStatus}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
        >
          {SUBSCRIPTION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="monthly_price"
            className="block text-sm font-medium text-stone-700"
          >
            Monthly price
          </label>
          <input
            id="monthly_price"
            name="monthly_price"
            type="number"
            min="0"
            step="1"
            defaultValue={company.monthlyPrice}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="billing_currency"
            className="block text-sm font-medium text-stone-700"
          >
            Currency
          </label>
          <select
            id="billing_currency"
            name="billing_currency"
            defaultValue={company.billingCurrency}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
          >
            {BILLING_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="billing_interval"
          className="block text-sm font-medium text-stone-700"
        >
          Billing interval
        </label>
        <select
          id="billing_interval"
          name="billing_interval"
          defaultValue={company.billingInterval}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
        >
          {BILLING_INTERVALS.map((interval) => (
            <option key={interval} value={interval}>
              {interval}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          name="grandfathered"
          value="true"
          defaultChecked={company.grandfathered}
          className="rounded border-stone-300"
        />
        Grandfathered pricing
      </label>

      <div>
        <label
          htmlFor="trial_ends_at"
          className="block text-sm font-medium text-stone-700"
        >
          Trial ends (optional)
        </label>
        <input
          id="trial_ends_at"
          name="trial_ends_at"
          type="date"
          defaultValue={trialEndsDefault}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-stone-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
          placeholder="Internal notes about pricing or billing."
        />
      </div>

      <SubmitButton pending={pending}>Save subscription</SubmitButton>
    </form>
  );
}
