"use client";

import { useActionState } from "react";
import { updateCompanySettingsAction } from "@/features/company/actions";
import { SubmitButton } from "@/features/admin/components/ui";

export function CompanySettingsForm({
  defaultRateCents,
  defaultNightBeforeReminderTime,
}: {
  defaultRateCents: number | null;
  defaultNightBeforeReminderTime: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateCompanySettingsAction,
    {} as { error?: string; ok?: boolean }
  );

  return (
    <form action={formAction} className="max-w-md space-y-6">
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
        <h2 className="text-sm font-semibold text-stone-900">Billing</h2>
        <label
          htmlFor="default_hike_rate"
          className="mt-3 block text-sm font-medium text-stone-700"
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

      <div>
        <h2 className="text-sm font-semibold text-stone-900">Customer texts</h2>
        <label
          htmlFor="night_before_reminder_time"
          className="mt-3 block text-sm font-medium text-stone-700"
        >
          Night-before reminder time
        </label>
        <p className="mt-0.5 text-xs text-stone-500">
          Local time to text customers about tomorrow&apos;s pickup. Runs on the
          next hourly check at or after this time.
        </p>
        <input
          id="night_before_reminder_time"
          name="night_before_reminder_time"
          type="time"
          required
          defaultValue={defaultNightBeforeReminderTime.slice(0, 5)}
          className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>

      <SubmitButton pending={pending}>Save settings</SubmitButton>
    </form>
  );
}
