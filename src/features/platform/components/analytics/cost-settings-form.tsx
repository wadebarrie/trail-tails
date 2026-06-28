"use client";

import { useActionState } from "react";
import { updateCostAssumptionsAction } from "@/features/platform/analytics/actions";
import { SubmitButton } from "@/features/admin/components/ui";
import type { PlatformCostAssumptions } from "@/features/platform/analytics/types";

export function CostSettingsForm({
  assumptions,
}: {
  assumptions: PlatformCostAssumptions;
}) {
  const [state, formAction, pending] = useActionState(updateCostAssumptionsAction, {
    ok: false as const,
    error: "",
  });

  return (
    <form action={formAction} className="max-w-xl space-y-4 rounded-xl border border-stone-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">Cost assumptions</h2>
        <p className="mt-1 text-sm text-stone-600">
          Estimated unit costs used to calculate per-company COGS and margin. Update
          when you have better billing data.
        </p>
      </div>

      {state.ok ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Settings saved.
        </p>
      ) : null}
      {!state.ok && "error" in state && state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <Field
        label="Outbound SMS (USD)"
        name="sms_outbound_usd"
        defaultValue={assumptions.sms_outbound_usd}
        step="0.0001"
      />
      <Field
        label="Inbound SMS (USD)"
        name="sms_inbound_usd"
        defaultValue={assumptions.sms_inbound_usd}
        step="0.0001"
      />
      <Field
        label="ETA calculation (USD)"
        name="eta_calculation_usd"
        defaultValue={assumptions.eta_calculation_usd}
        step="0.0001"
      />
      <Field
        label="Geocode call (USD)"
        name="geocode_usd"
        defaultValue={assumptions.geocode_usd}
        step="0.0001"
      />
      <Field
        label="Base infra per company (USD/mo)"
        name="base_infra_per_company_usd"
        defaultValue={assumptions.base_infra_per_company_usd}
        step="0.01"
      />
      <Field
        label="Supabase platform total (USD/mo)"
        name="supabase_platform_usd"
        defaultValue={assumptions.supabase_platform_usd}
        step="0.01"
      />
      <Field
        label="Netlify platform total (USD/mo)"
        name="netlify_platform_usd"
        defaultValue={assumptions.netlify_platform_usd}
        step="0.01"
      />

      <p className="text-xs text-stone-500">
        Supabase and Netlify totals are split evenly across all companies for margin
        estimates.
      </p>

      <SubmitButton pending={pending}>Save assumptions</SubmitButton>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  step,
}: {
  label: string;
  name: string;
  defaultValue: number;
  step: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="number"
        required
        step={step}
        min="0"
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
      />
    </div>
  );
}
