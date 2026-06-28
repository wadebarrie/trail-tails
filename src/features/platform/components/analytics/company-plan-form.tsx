"use client";

import { useActionState } from "react";
import { updateCompanyPlanAction } from "@/features/platform/analytics/actions";
import { SubmitButton } from "@/features/admin/components/ui";
import type { CompanyDetailMetrics } from "@/features/platform/analytics/types";

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
      <h2 className="text-lg font-semibold text-stone-900">Plan &amp; billing</h2>
      <input type="hidden" name="company_id" value={company.id} />

      {state.ok ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Company plan updated.
        </p>
      ) : null}
      {!state.ok && "error" in state && state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor="plan_tier" className="block text-sm font-medium text-stone-700">
          Plan
        </label>
        <select
          id="plan_tier"
          name="plan_tier"
          defaultValue={company.planTier}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
        >
          <option value="trial">Trial</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-stone-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={company.status}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="churned">Churned</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="monthly_subscription_cents"
          className="block text-sm font-medium text-stone-700"
        >
          Monthly subscription (cents)
        </label>
        <input
          id="monthly_subscription_cents"
          name="monthly_subscription_cents"
          type="number"
          min="0"
          step="1"
          defaultValue={company.monthlySubscriptionCents}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
        />
        <p className="mt-1 text-xs text-stone-500">
          e.g. 9900 = $99.00/mo. No payment processing — tracking only.
        </p>
      </div>

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

      <SubmitButton pending={pending}>Save plan</SubmitButton>
    </form>
  );
}
