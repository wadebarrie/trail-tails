"use client";

import { useActionState } from "react";
import Link from "next/link";
import { selfSignupAction } from "@/features/onboarding/actions";
import { OnboardingSupportCard } from "@/features/onboarding/components/onboarding-support-card";
import { SubmitButton } from "@/features/admin/components/ui";
import { COMMON_TIMEZONES } from "@/features/platform/timezones";

export function SelfSignupForm() {
  const [state, formAction, pending] = useActionState(selfSignupAction, {
    ok: false as const,
    error: "",
  });

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {!state.ok &&
      "error" in state &&
      typeof state.error === "string" &&
      state.error.trim() ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="company_name"
          className="block text-sm font-medium text-stone-700"
        >
          Company name
        </label>
        <input
          id="company_name"
          name="company_name"
          required
          disabled={pending}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none ring-[var(--color-trail-600)] focus:ring-2 disabled:opacity-60"
        />
      </div>

      <div>
        <label
          htmlFor="timezone"
          className="block text-sm font-medium text-stone-700"
        >
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

      <div>
        <label
          htmlFor="admin_full_name"
          className="block text-sm font-medium text-stone-700"
        >
          Your name
        </label>
        <input
          id="admin_full_name"
          name="admin_full_name"
          required
          autoComplete="name"
          disabled={pending}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none ring-[var(--color-trail-600)] focus:ring-2 disabled:opacity-60"
        />
      </div>

      <div>
        <label
          htmlFor="admin_email"
          className="block text-sm font-medium text-stone-700"
        >
          Work email
        </label>
        <input
          id="admin_email"
          name="admin_email"
          type="email"
          required
          autoComplete="email"
          disabled={pending}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none ring-[var(--color-trail-600)] focus:ring-2 disabled:opacity-60"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-stone-700"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          disabled={pending}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none ring-[var(--color-trail-600)] focus:ring-2 disabled:opacity-60"
        />
        <p className="mt-1 text-xs text-stone-500">
          At least 12 characters with a letter and a number.
        </p>
      </div>

      <div>
        <label
          htmlFor="password_confirm"
          className="block text-sm font-medium text-stone-700"
        >
          Confirm password
        </label>
        <input
          id="password_confirm"
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          disabled={pending}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none ring-[var(--color-trail-600)] focus:ring-2 disabled:opacity-60"
        />
      </div>

      <OnboardingSupportCard compact />

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

      <SubmitButton pending={pending} className="w-full rounded-xl py-3">
        Create account and start setup
      </SubmitButton>
    </form>
  );
}
