"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import {
  changeSelfSignupEmailAction,
  resendSelfSignupAction,
  selfSignupAction,
  type SelfSignupResult,
} from "@/features/onboarding/actions";
import { TurnstileField } from "@/features/auth/components/turnstile-field";
import { SubmitButton } from "@/features/admin/components/ui";
import { COMMON_TIMEZONES } from "@/features/platform/timezones";

const initialState: SelfSignupResult = { ok: false, error: "" };

export function SelfSignupForm({ siteKey }: { siteKey: string | null }) {
  const [state, formAction, pending] = useActionState(selfSignupAction, initialState);

  if (state.ok && state.step === "check_email") {
    return (
      <CheckEmail
        email={state.email}
        warning={state.warning}
        siteKey={siteKey}
      />
    );
  }

  const error = !state.ok && state.error.trim() ? state.error : null;

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {!siteKey ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Signup is unavailable until bot protection is configured.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Field id="company_name" name="company_name" label="Company name" pending={pending} />
      <div>
        <label htmlFor="timezone" className="block text-sm font-medium text-stone-700">
          Timezone
        </label>
        <select
          id="timezone"
          name="timezone"
          required
          disabled={pending}
          defaultValue="America/Vancouver"
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none ring-[var(--color-trail-600)] focus:ring-2 disabled:opacity-60"
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>
      <Field
        id="admin_full_name"
        name="admin_full_name"
        label="Your name"
        autoComplete="name"
        pending={pending}
      />
      <Field
        id="admin_email"
        name="admin_email"
        label="Work email"
        type="email"
        autoComplete="email"
        pending={pending}
      />
      <Field
        id="password"
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        minLength={12}
        pending={pending}
        hint="At least 12 characters with a letter and a number."
      />
      <Field
        id="password_confirm"
        name="password_confirm"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        minLength={12}
        pending={pending}
      />

      <TurnstileField siteKey={siteKey} />

      <div className="space-y-2 text-xs leading-relaxed text-stone-500">
        <p>
          By creating an account, you agree to PackRoute&apos;s{" "}
          <Link
            href="/legal/terms"
            className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/legal/privacy"
            className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>
          . You get a 30-day free trial — no card required.
        </p>
      </div>

      <SubmitButton pending={pending} className="w-full rounded-xl py-3" disabled={!siteKey}>
        Email me a confirmation link
      </SubmitButton>
    </form>
  );
}

function CheckEmail({
  email,
  warning,
  siteKey,
}: {
  email: string;
  warning?: string;
  siteKey: string | null;
}) {
  const [resendState, resendAction, resendPending] = useActionState(
    resendSelfSignupAction,
    {}
  );
  const [changed, setChanged] = useState(false);
  const [pendingChange, startChange] = useTransition();

  if (changed) {
    return <SelfSignupForm siteKey={siteKey} />;
  }

  return (
    <div className="mt-8 space-y-4">
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        Check <strong>{email}</strong> for a confirmation link. We create your
        company only after you open it, then take you to the setup wizard.
        The link expires in 24 hours.
      </p>
      {warning || resendState.warning ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {resendState.warning ?? warning}
        </p>
      ) : null}
      {resendState.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {resendState.error}
        </p>
      ) : null}
      <form action={resendAction} className="space-y-3">
        <input type="hidden" name="email" value={email} />
        <TurnstileField siteKey={siteKey} />
        <SubmitButton pending={resendPending} className="w-full rounded-xl py-3">
          Resend confirmation email
        </SubmitButton>
      </form>
      <button
        type="button"
        className="text-sm font-medium text-[var(--color-trail-700)] hover:underline disabled:opacity-60"
        disabled={pendingChange}
        onClick={() => {
          startChange(async () => {
            await changeSelfSignupEmailAction(email);
            setChanged(true);
          });
        }}
      >
        {pendingChange ? "Updating…" : "Use a different email"}
      </button>
    </div>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  minLength,
  pending,
  hint,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  minLength?: number;
  pending: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        minLength={minLength}
        disabled={pending}
        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none ring-[var(--color-trail-600)] focus:ring-2 disabled:opacity-60"
      />
      {hint ? <p className="mt-1 text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}
