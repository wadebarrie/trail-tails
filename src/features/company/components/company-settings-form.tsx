"use client";

import { useActionState } from "react";
import { updateCompanySettingsAction } from "@/features/company/actions";
import { SubmitButton } from "@/features/admin/components/ui";
import { TimePickerField } from "@/features/admin/components/time-picker-field";
import { COMMON_TIMEZONES } from "@/features/platform/timezones";

export function CompanySettingsForm({
  companyName,
  timezone,
  defaultRateCents,
  defaultNightBeforeReminderTime,
}: {
  companyName: string;
  timezone: string;
  defaultRateCents: number | null;
  defaultNightBeforeReminderTime: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateCompanySettingsAction,
    {} as { error?: string; ok?: boolean }
  );

  const timezoneOptions =
    COMMON_TIMEZONES.some((tz) => tz.value === timezone) || !timezone
      ? COMMON_TIMEZONES
      : ([
          { value: timezone, label: `${timezone} (current)` },
          ...COMMON_TIMEZONES,
        ] as const);

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
        <h2 className="text-sm font-semibold text-stone-900">Company</h2>
        <label
          htmlFor="company_name"
          className="mt-3 block text-sm font-medium text-stone-700"
        >
          Company name
        </label>
        <p className="mt-0.5 text-xs text-stone-500">
          Shown in the sidebar and on your PackRoute account.
        </p>
        <input
          id="company_name"
          name="company_name"
          required
          maxLength={80}
          defaultValue={companyName}
          autoComplete="organization"
          className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2"
        />

        <label
          htmlFor="timezone"
          className="mt-4 block text-sm font-medium text-stone-700"
        >
          Timezone
        </label>
        <p className="mt-0.5 text-xs text-stone-500">
          Used for Today / Tomorrow, night-before reminder texts, and calendar
          days.
        </p>
        <select
          id="timezone"
          name="timezone"
          required
          defaultValue={timezone || "America/Vancouver"}
          className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
        >
          {timezoneOptions.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-stone-900">Hike prices</h2>
        <label
          htmlFor="default_hike_rate"
          className="mt-3 block text-sm font-medium text-stone-700"
        >
          Default price per hike ($)
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
          What time should we text customers the night before a hike? Uses your
          company timezone above.
        </p>
        <TimePickerField
          id="night_before_reminder_time"
          name="night_before_reminder_time"
          required
          defaultValue={defaultNightBeforeReminderTime.slice(0, 5)}
          className="mt-2"
        />
      </div>

      <SubmitButton pending={pending}>Save settings</SubmitButton>
    </form>
  );
}
