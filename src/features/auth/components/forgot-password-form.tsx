"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AUTH_ROUTES } from "@/features/auth/constants";
import { getAuthCallbackUrl } from "@/lib/site-url";
import { primaryButtonClassName } from "@/features/admin/components/button-styles";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email is required.");
      setPending(false);
      return;
    }

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: getAuthCallbackUrl(AUTH_ROUTES.resetPassword),
    });

    if (resetError) {
      setError(resetError.message);
      setPending(false);
      return;
    }

    setSent(true);
    setPending(false);
  }

  if (sent) {
    return (
      <div className="mt-8 space-y-4">
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          If an account exists for <strong>{email.trim()}</strong>, we sent a password
          reset link. Check your inbox and spam folder — the link expires in about an
          hour.
        </p>
        <Link
          href={AUTH_ROUTES.login}
          className="inline-block text-sm font-medium text-[var(--color-trail-700)] hover:underline"
        >
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none ring-[var(--color-trail-600)] focus:ring-2 disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className={`${primaryButtonClassName} w-full rounded-xl py-3`}
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>

      <Link
        href={AUTH_ROUTES.login}
        className="block text-center text-sm font-medium text-[var(--color-trail-700)] hover:underline"
      >
        ← Back to sign in
      </Link>
    </form>
  );
}
