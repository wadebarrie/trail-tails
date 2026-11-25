"use client";

import { useActionState } from "react";
import { updateCompanySettingsAction } from "@/features/company/actions";
import type { RouteCadence } from "@/features/company/route-cadence";
import { SubmitButton } from "@/features/admin/components/ui";
import { TimePickerField } from "@/features/admin/components/time-picker-field";
import { COMMON_TIMEZONES } from "@/features/platform/timezones";

export function CompanySettingsForm({
  companyName,
  timezone,
  routeCadence,
  defaultRateCents,
  defaultNightBeforeReminderTime,
  autoSendGalleryOnCloseout = true,
  smsSettingsAvailable = true,
  smsMode = "live",
  smsTestPhone = "",
  smsLiveApproved = true,
}: {
  companyName: string;
  timezone: string;
  routeCadence: RouteCadence;
  defaultRateCents: number | null;
  defaultNightBeforeReminderTime: string;
  autoSendGalleryOnCloseout?: boolean;
  smsSettingsAvailable?: boolean;
  smsMode?: "test" | "live";
  smsTestPhone?: string;
  smsLiveApproved?: boolean;
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
        <h2 className="text-sm font-semibold text-stone-900">PackRoutes</h2>
        <p className="mt-1 text-xs text-stone-500">
          Controls whether the app asks for morning vs afternoon, or treats each
          PackRoute as a once-a-day zone.
        </p>
        <fieldset className="mt-3 space-y-2">
          <legend className="sr-only">How many runs per day</legend>
          <label className="flex cursor-pointer items-start gap-2 text-sm text-stone-800">
            <input
              type="radio"
              name="route_cadence"
              value="once"
              defaultChecked={routeCadence === "once"}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">One PackRoute per day</span>
              <span className="mt-0.5 block text-xs text-stone-500">
                Pick up and drop off once — no morning/afternoon split.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 text-sm text-stone-800">
            <input
              type="radio"
              name="route_cadence"
              value="twice"
              defaultChecked={routeCadence === "twice"}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Morning and afternoon</span>
              <span className="mt-0.5 block text-xs text-stone-500">
                Separate PackRoutes for each period (different dogs and order).
              </span>
            </span>
          </label>
        </fieldset>
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
        {smsSettingsAvailable ? (
        <>
        <p className="mt-1 text-xs text-stone-500">
          Test mode sends every text to your phone, not to customers. Live mode
          texts the numbers on each customer. Trial companies can send 25 texts
          a day.
        </p>
        <fieldset className="mt-3 space-y-2">
          <legend className="sr-only">Text mode</legend>
          <label className="flex items-start gap-2 text-sm text-stone-800">
            <input
              type="radio"
              name="sms_mode"
              value="test"
              defaultChecked={smsMode !== "live"}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Test</span>
              <span className="mt-0.5 block text-xs text-stone-500">
                All texts go to the mobile number below.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-stone-800">
            <input
              type="radio"
              name="sms_mode"
              value="live"
              defaultChecked={smsMode === "live"}
              className="mt-0.5"
              disabled={!smsLiveApproved}
            />
            <span>
              <span className="font-medium">Live</span>
              <span className="mt-0.5 block text-xs text-stone-500">
                {smsLiveApproved
                  ? "Texts go to each customer."
                  : "PackRoute turns this on after a quick check during beta."}
              </span>
            </span>
          </label>
        </fieldset>
        <label
          htmlFor="sms_test_phone"
          className="mt-4 block text-sm font-medium text-stone-700"
        >
          Your mobile for test texts
        </label>
        <input
          id="sms_test_phone"
          name="sms_test_phone"
          type="tel"
          defaultValue={smsTestPhone}
          placeholder="+1 604 555 0100"
          className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2"
        />
        <label className="mt-3 flex items-start gap-2 text-sm text-stone-700">
          <input type="checkbox" name="sms_customer_consent" value="yes" className="mt-1" />
          <span>Customers have agreed to receive schedule texts from this company.</span>
        </label>
        </>
        ) : null}
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

        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-stone-700">
            Hike photo gallery texts
          </legend>
          <p className="mt-0.5 text-xs text-stone-500">
            When a hike is closed out and owners have tagged photos, text them a
            gallery link. Turn this off to review first on Hike photos.
          </p>
          <div className="mt-3 space-y-2">
            <label className="flex items-start gap-2 text-sm text-stone-700">
              <input
                type="radio"
                name="auto_send_gallery_on_closeout"
                value="true"
                defaultChecked={autoSendGalleryOnCloseout}
                className="mt-1"
              />
              <span>Send automatically on close-out</span>
            </label>
            <label className="flex items-start gap-2 text-sm text-stone-700">
              <input
                type="radio"
                name="auto_send_gallery_on_closeout"
                value="false"
                defaultChecked={!autoSendGalleryOnCloseout}
                className="mt-1"
              />
              <span>
                Review first — use Send today&apos;s galleries on Hike photos
              </span>
            </label>
          </div>
        </fieldset>
      </div>

      <SubmitButton pending={pending}>Save settings</SubmitButton>
    </form>
  );
}
