"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AUTH_ROUTES } from "@/features/auth/constants";
import { passwordSchema } from "@/lib/password";
import { primaryButtonClassName } from "@/features/admin/components/button-styles";

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const passwordConfirm = String(formData.get("password_confirm") ?? "");

    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid password.");
      setPending(false);
      return;
    }

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      setPending(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setPending(false);
      return;
    }

    await supabase.auth.signOut();
    router.replace(`${AUTH_ROUTES.login}?reset=1`);
    router.refresh();
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-stone-700">
          New password
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
          Confirm new password
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

      <button
        type="submit"
        disabled={pending}
        className={`${primaryButtonClassName} w-full rounded-xl py-3`}
      >
        {pending ? "Updating…" : "Update password"}
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
