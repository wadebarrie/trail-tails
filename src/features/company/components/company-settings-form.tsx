"use client";

import { useActionState } from "react";
import { updateCompanySettingsAction } from "@/features/company/actions";
import { SubmitButton } from "@/features/admin/components/ui";

export function CompanySettingsForm({
  defaultRateCents,
}: {
  defaultRateCents: number | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateCompanySettingsAction,
    {} as { error?: string; ok?: boolean }
  );

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          Settings saved.
        </p>
      ) : null}

      <div>
        <label
          htmlFor="default_hike_rate"
          className="block text-sm font-medium text-stone-700"
        >
          Default hike price ($)
        </label>
        <p className="mt-0.5 text-xs text-stone-500">
          Used for billing unless a dog has its own rate.
        </p>
        <input
          id="default_hike_rate"
          name="default_hike_rate"
          type="number"
          step="0.01"
          min="0"
          placeholder="60.00"
          defaultValue={
            defaultRateCents != null
              ? (defaultRateCents / 100).toFixed(2)
              : ""
          }
          className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>

      <SubmitButton pending={pending}>Save settings</SubmitButton>
    </form>
  );
}
