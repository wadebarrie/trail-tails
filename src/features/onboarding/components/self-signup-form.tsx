"use client";

import { useActionState, useEffect, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import {
  changeSelfSignupEmailAction,
  resendSelfSignupAction,
  selfSignupAction,
  type SignupFormValues,
  type SelfSignupResult,
} from "@/features/onboarding/actions";
import { TurnstileField } from "@/features/auth/components/turnstile-field";
import { SubmitButton } from "@/features/admin/components/ui";
import { trackEvent } from "@/features/landing/analytics";
import { COMMON_TIMEZONES } from "@/features/platform/timezones";

const initialState: SelfSignupResult = { ok: false, error: "" };

const PROVINCES = [
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "NT",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
] as const;

export function SelfSignupForm({ siteKey }: { siteKey: string | null }) {
  const [state, formAction, pending] = useActionState(selfSignupAction, initialState);

  useEffect(() => {
    if (state.ok && state.step === "check_email") {
      trackEvent("signup_completed", { stage: "check_email" });
    }
  }, [state]);

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
  const values = !state.ok ? state.values : undefined;
  const fieldErrors = !state.ok ? state.fieldErrors : undefined;
  const revision = !state.ok ? state.revision ?? 0 : 0;

  return (
    <form
      action={formAction}
      className="mt-8 space-y-4"
      onSubmit={() => trackEvent("signup_started", { stage: "form" })}
    >
      {!siteKey ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Signup is unavailable until bot protection is configured.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <SignupFields
        key={revision}
        pending={pending}
        values={values}
        fieldErrors={fieldErrors}
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

      <SubmitButton
        pending={pending}
        pendingLabel="Creating your account…"
        className="w-full rounded-xl py-3"
        disabled={!siteKey}
      >
        Email me a confirmation link
      </SubmitButton>
    </form>
  );
}

function SignupFields({
  pending,
  values,
  fieldErrors,
}: {
  pending: boolean;
  values?: SignupFormValues;
  fieldErrors?: Partial<Record<string, string>>;
}) {
  const browserTimezone = useSyncExternalStore(
    () => () => {},
    () => {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return COMMON_TIMEZONES.some((zone) => zone.value === detected)
        ? detected
        : "America/Vancouver";
    },
    () => "America/Vancouver"
  );
  const [chosenTimezone, setChosenTimezone] = useState<string | null>(
    values?.timezone || null
  );
  const timezone = chosenTimezone ?? browserTimezone;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <Field
        id="company_name"
        name="company_name"
        label="Company name"
        pending={pending}
        defaultValue={values?.company_name}
        error={fieldErrors?.company_name}
      />
      <div>
        <label htmlFor="timezone" className="block text-sm font-medium text-stone-700">
          Timezone
        </label>
        <select
          id="timezone"
          name="timezone"
          required
          disabled={pending}
          value={timezone}
          onChange={(event) => setChosenTimezone(event.target.value)}
          aria-invalid={fieldErrors?.timezone ? true : undefined}
          aria-describedby={fieldErrors?.timezone ? "timezone-error" : undefined}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none ring-[var(--color-trail-600)] focus:ring-2 disabled:opacity-60"
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        {fieldErrors?.timezone ? (
          <p id="timezone-error" className="mt-1 text-xs text-red-700">
            {fieldErrors.timezone}
          </p>
        ) : null}
      </div>
      <Field
        id="admin_full_name"
        name="admin_full_name"
        label="Your name"
        autoComplete="name"
        pending={pending}
        defaultValue={values?.admin_full_name}
        error={fieldErrors?.admin_full_name}
      />
      <Field
        id="admin_email"
        name="admin_email"
        label="Email"
        type="email"
        autoComplete="email"
        pending={pending}
        defaultValue={values?.admin_email}
        error={fieldErrors?.admin_email}
      />
      <Field
        id="admin_phone"
        name="admin_phone"
        label="Mobile (optional)"
        type="tel"
        autoComplete="tel"
        pending={pending}
        required={false}
        defaultValue={values?.admin_phone}
        error={fieldErrors?.admin_phone}
        hint="Used for test texts. Customers are not texted until you switch to live."
      />
      <div>
        <label htmlFor="province" className="block text-sm font-medium text-stone-700">
          Province (optional)
        </label>
        <select
          id="province"
          name="province"
          disabled={pending}
          defaultValue={values?.province ?? ""}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none ring-[var(--color-trail-600)] focus:ring-2 disabled:opacity-60"
        >
          <option value="">Select later</option>
          {PROVINCES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>
      <Field
        id="password"
        name="password"
        label="Password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        minLength={12}
        pending={pending}
        defaultValue={values?.password}
        error={fieldErrors?.password}
        hint="At least 12 characters with a letter and a number."
        hintId="password-hint"
        onTogglePassword={() => setShowPassword((current) => !current)}
        passwordVisible={showPassword}
      />
      <Field
        id="password_confirm"
        name="password_confirm"
        label="Confirm password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        minLength={12}
        pending={pending}
        defaultValue={values?.password_confirm}
        error={fieldErrors?.password_confirm}
      />
    </>
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
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {resendState.error}
        </p>
      ) : null}
      <form action={resendAction} className="space-y-3">
        <input type="hidden" name="email" value={email} />
        <TurnstileField siteKey={siteKey} />
        <SubmitButton
          pending={resendPending}
          pendingLabel="Sending…"
          className="w-full rounded-xl py-3"
        >
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
  hintId,
  defaultValue,
  error,
  required = true,
  onTogglePassword,
  passwordVisible,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  minLength?: number;
  pending: boolean;
  hint?: string;
  hintId?: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
  onTogglePassword?: () => void;
  passwordVisible?: boolean;
}) {
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId ?? `${id}-hint` : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          autoComplete={autoComplete}
          minLength={minLength}
          disabled={pending}
          defaultValue={defaultValue}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none ring-[var(--color-trail-600)] focus:ring-2 disabled:opacity-60"
        />
        {onTogglePassword ? (
          <button
            type="button"
            className="absolute top-1/2 right-2 -translate-y-1/2 text-xs font-medium text-stone-500"
            onClick={onTogglePassword}
          >
            {passwordVisible ? "Hide" : "Show"}
          </button>
        ) : null}
      </div>
      {hint ? (
        <p id={hintId ?? `${id}-hint`} className="mt-1 text-xs text-stone-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
