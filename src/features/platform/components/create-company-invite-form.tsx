"use client";

import { useActionState } from "react";
import { createCompanyInviteAction } from "@/features/platform/actions";
import { SubmitButton } from "@/features/admin/components/ui";
import { COMMON_TIMEZONES } from "@/features/platform/timezones";

export function CreateCompanyInviteForm({
  invitesEnabled = true,
}: {
  invitesEnabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(createCompanyInviteAction, {
    ok: false as const,
    error: "",
  });

  return (
    <div className="space-y-4">
      <form action={formAction} className="max-w-lg space-y-4 rounded-xl border border-stone-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Invite a beta company</h2>
          <p className="mt-1 text-sm text-stone-600">
            Creates a new company and a one-time admin signup link (valid 7 days).
          </p>
        </div>

        {!invitesEnabled ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Signups are paused. Enable new company signups in Owner → Settings to
            create invites.
          </p>
        ) : null}

        {!state.ok && "error" in state && state.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        <Field label="Company name" name="company_name" required disabled={!invitesEnabled} />
        <Field
          label="Admin full name"
          name="admin_full_name"
          required
          autoComplete="name"
          disabled={!invitesEnabled}
        />
        <Field
          label="Admin email"
          name="admin_email"
          type="email"
          required
          autoComplete="email"
          disabled={!invitesEnabled}
        />

        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-stone-700">
            Timezone
          </label>
          <select
            id="timezone"
            name="timezone"
            required
            disabled={!invitesEnabled}
            defaultValue="America/Vancouver"
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none ring-[var(--color-trail-600)] focus:ring-2"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        <SubmitButton pending={pending} disabled={!invitesEnabled}>
          Create company &amp; invite
        </SubmitButton>
      </form>

      {state.ok ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-900">Invite link ready</p>
          <p className="mt-1 text-sm text-emerald-800">
            Send this link to the new admin. It can only be used once.
          </p>
          <input
            readOnly
            value={state.inviteUrl}
            className="mt-3 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-stone-800"
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  disabled,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none ring-[var(--color-trail-600)] focus:ring-2 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500"
      />
    </div>
  );
}
