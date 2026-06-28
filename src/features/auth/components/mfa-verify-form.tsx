"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getLoginRedirect } from "@/features/auth/access";
import { AUTH_ROUTES } from "@/features/auth/constants";
import { primaryButtonClassName } from "@/features/admin/components/button-styles";

type MfaVerifyFormProps = {
  /** After verify, go here instead of default admin home (login flow). */
  nextPath?: string;
  /** When true, stay on MFA page and refresh (dashboard gate). */
  stayOnPage?: boolean;
};

export function MfaVerifyForm({ nextPath, stayOnPage }: MfaVerifyFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { data: factors, error: listError } =
      await supabase.auth.mfa.listFactors();

    if (listError) {
      setError(listError.message);
      setPending(false);
      return;
    }

    const totpFactor = factors?.totp?.find((factor) => factor.status === "verified");

    if (!totpFactor) {
      setError("No authenticator is enrolled on this account.");
      setPending(false);
      return;
    }

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: totpFactor.id });

    if (challengeError || !challenge) {
      setError(challengeError?.message ?? "Could not start verification.");
      setPending(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: totpFactor.id,
      challengeId: challenge.id,
      code: code.trim(),
    });

    if (verifyError) {
      setError("Invalid code. Try again.");
      setPending(false);
      return;
    }

    if (stayOnPage) {
      router.replace(AUTH_ROUTES.adminHome);
      router.refresh();
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Session expired. Sign in again.");
      setPending(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active, can_drive")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_active) {
      await supabase.auth.signOut();
      setError("Your account has been deactivated.");
      setPending(false);
      return;
    }

    router.replace(
      getLoginRedirect(
        profile as { role: "admin" | "driver"; can_drive: boolean },
        nextPath
      )
    );
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-stone-600">
        Enter the 6-digit code from your authenticator app.
      </p>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div>
        <label htmlFor="mfa-verify-code" className="block text-sm font-medium text-stone-700">
          Verification code
        </label>
        <input
          id="mfa-verify-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          disabled={pending}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none ring-[var(--color-trail-600)] focus:ring-2 disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={pending || code.length !== 6}
        className={`${primaryButtonClassName} w-full rounded-xl py-3`}
      >
        {pending ? "Verifying…" : "Continue"}
      </button>
    </form>
  );
}
