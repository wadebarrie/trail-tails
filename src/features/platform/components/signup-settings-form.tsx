"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/features/admin/components/ui";
import { updatePlatformSettingsAction } from "@/features/platform/settings-actions";
import type { PlatformSettings } from "@/features/platform/settings";

export function SignupSettingsForm({ settings }: { settings: PlatformSettings }) {
  const [state, formAction, pending] = useActionState(updatePlatformSettingsAction, {
    ok: false as const,
    error: "",
  });

  const invitesEnabled = settings.invites_enabled;
  const selfSignupEnabled = settings.self_signup_enabled;

  return (
    <form
      action={formAction}
      className="max-w-xl space-y-4 rounded-xl border border-stone-200 bg-white p-6"
    >
      <div>
        <h2 className="text-lg font-semibold text-stone-900">Company signups</h2>
        <p className="mt-1 text-sm text-stone-600">
          Control invite provisioning and public self-serve signup. Existing
          companies and logins are not affected.
        </p>
      </div>

      {state.ok ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Signup settings saved.
        </p>
      ) : null}
      {!state.ok && "error" in state && state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 bg-stone-50/80 p-4">
        <input
          type="checkbox"
          name="invites_enabled"
          value="on"
          defaultChecked={invitesEnabled}
          className="mt-1 h-4 w-4 rounded border-stone-300 text-[var(--color-cta)] focus:ring-[var(--color-trail-100)]"
        />
        <span>
          <span className="block text-sm font-medium text-stone-900">
            Allow invite-based signups
          </span>
          <span className="mt-1 block text-sm text-stone-600">
            When off, you cannot create invites and outstanding invite links show a
            paused message. Also pauses self-serve signup.
          </span>
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 bg-stone-50/80 p-4">
        <input
          type="checkbox"
          name="self_signup_enabled"
          value="on"
          defaultChecked={selfSignupEnabled}
          className="mt-1 h-4 w-4 rounded border-stone-300 text-[var(--color-cta)] focus:ring-[var(--color-trail-100)]"
        />
        <span>
          <span className="block text-sm font-medium text-stone-900">
            Allow public self-serve signup
          </span>
          <span className="mt-1 block text-sm text-stone-600">
            When on, `/signup` without an invite token creates a company + admin
            and starts the first-run wizard. Leave off until you are ready.
          </span>
        </span>
      </label>

      <p className="text-xs text-stone-500">
        Invites:{" "}
        <strong className={invitesEnabled ? "text-emerald-700" : "text-amber-700"}>
          {invitesEnabled ? "open" : "paused"}
        </strong>
        {" · "}
        Self-serve:{" "}
        <strong
          className={selfSignupEnabled ? "text-emerald-700" : "text-amber-700"}
        >
          {selfSignupEnabled ? "open" : "closed"}
        </strong>
      </p>

      <SubmitButton pending={pending}>Save signup settings</SubmitButton>
    </form>
  );
}
