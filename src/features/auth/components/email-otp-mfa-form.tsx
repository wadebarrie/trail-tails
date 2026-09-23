"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  sendAdminEmailOtpAction,
  verifyAdminEmailOtpAction,
} from "@/features/auth/actions-email-mfa";
import { getLoginRedirect } from "@/features/auth/access";
import { AUTH_ROUTES } from "@/features/auth/constants";
import { createClient } from "@/lib/supabase/client";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/features/admin/components/button-styles";
import { MfaVerifyForm } from "@/features/auth/components/mfa-verify-form";

type EmailOtpMfaFormProps = {
  nextPath?: string;
  /** When true, stay in admin shell and go to dashboard after success. */
  stayOnPage?: boolean;
  /** Show optional authenticator path if the account has TOTP enrolled. */
  showTotpOption?: boolean;
};

export function EmailOtpMfaForm({
  nextPath,
  stayOnPage,
  showTotpOption = false,
}: EmailOtpMfaFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [mode, setMode] = useState<"email" | "totp">("email");
  const [sending, startSend] = useTransition();
  const [verifying, startVerify] = useTransition();
  const [sentOnce, setSentOnce] = useState(false);

  useEffect(() => {
    startSend(async () => {
      const result = await sendAdminEmailOtpAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSentOnce(true);
      setInfo("We sent a one-time code to your email.");
    });
    // Intentionally once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resend() {
    setError(null);
    startSend(async () => {
      const result = await sendAdminEmailOtpAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSentOnce(true);
      setInfo("A new code is on the way.");
    });
  }

  function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startVerify(async () => {
      const result = await verifyAdminEmailOtpAction(code);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (stayOnPage) {
        router.replace(AUTH_ROUTES.adminHome);
        router.refresh();
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Session expired. Sign in again.");
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
        return;
      }

      router.replace(
        getLoginRedirect(
          profile as { role: "admin" | "driver"; can_drive: boolean },
          nextPath
        )
      );
      router.refresh();
    });
  }

  if (mode === "totp" && showTotpOption) {
    return (
      <div className="space-y-4">
        <MfaVerifyForm nextPath={nextPath} stayOnPage={stayOnPage} />
        <button
          type="button"
          className={`${secondaryButtonClassName} w-full rounded-xl py-3`}
          onClick={() => setMode("email")}
        >
          Use email code instead
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <p className="text-sm text-stone-600">
        Enter the one-time code we emailed you. No authenticator app needed.
      </p>

      {info ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {info}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="email-otp-code"
          className="block text-sm font-medium text-stone-700"
        >
          Email code
        </label>
        <input
          id="email-otp-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6,8}"
          maxLength={8}
          required
          disabled={verifying}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none ring-[var(--color-trail-600)] focus:ring-2 disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={verifying || code.length < 6}
        className={`${primaryButtonClassName} w-full rounded-xl py-3`}
      >
        {verifying ? "Verifying…" : "Continue"}
      </button>

      <button
        type="button"
        disabled={sending}
        onClick={resend}
        className={`${secondaryButtonClassName} w-full rounded-xl py-3`}
      >
        {sending ? "Sending…" : sentOnce ? "Resend code" : "Send code"}
      </button>

      {showTotpOption ? (
        <button
          type="button"
          className="w-full text-center text-sm text-stone-600 underline-offset-2 hover:underline"
          onClick={() => setMode("totp")}
        >
          Use authenticator app instead
        </button>
      ) : null}
    </form>
  );
}
