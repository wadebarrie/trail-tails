"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getLoginRedirect } from "@/features/auth/access";
import { AUTH_ROUTES } from "@/features/auth/constants";
import { MfaVerifyForm } from "@/features/auth/components/mfa-verify-form";
import { primaryButtonClassName } from "@/features/admin/components/button-styles";

type LoginFormProps = {
  nextPath?: string;
};

type LoginStep = "credentials" | "mfa";

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState<LoginStep>("credentials");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Email and password are required.");
      setPending(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Invalid email or password.");
      setPending(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sign-in failed. Please try again.");
      setPending(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_active, can_drive, is_platform_owner")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setError(
        "Your account is not set up yet. Contact the office to finish onboarding."
      );
      setPending(false);
      return;
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      setError("Your account has been deactivated.");
      setPending(false);
      return;
    }

    if (profile.role === "admin") {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const enrolled = (factors?.totp ?? []).some(
        (factor) => factor.status === "verified"
      );

      if (!enrolled) {
        router.replace(`${AUTH_ROUTES.adminMfa}?setup=1`);
        router.refresh();
        return;
      }

      if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
        setStep("mfa");
        setPending(false);
        return;
      }
    }

    router.replace(
      getLoginRedirect(
        profile as { role: "admin" | "driver"; can_drive: boolean },
        nextPath
      )
    );
    router.refresh();
  }

  if (step === "mfa") {
    return (
      <div className="mt-8">
        <MfaVerifyForm nextPath={nextPath} />
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
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
          autoComplete="current-password"
          required
          disabled={pending}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none ring-[var(--color-trail-600)] focus:ring-2 disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className={`${primaryButtonClassName} w-full rounded-xl py-3`}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
