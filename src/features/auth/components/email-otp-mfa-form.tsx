"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAdminEmailMfaSatisfiedAction } from "@/features/auth/actions-email-mfa";
import { authErrorMessage } from "@/features/auth/lib/auth-error-message";
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

const OTP_SENT_KEY = "packroute_mfa_otp_sent_at";
/** Skip auto-resend after remounts / refresh within this window. */
const OTP_SEND_COOLDOWN_MS = 60_000;

function emailOtpRedirectTo(): string {
  const next = encodeURIComponent("/dashboard");
  return `${window.location.origin}/auth/callback?next=${next}&mfa=1`;
}

function recentlySentOtp(): boolean {
  try {
    const raw = sessionStorage.getItem(OTP_SENT_KEY);
    if (!raw) return false;
    const sentAt = Number(raw);
    if (!Number.isFinite(sentAt)) return false;
    return Date.now() - sentAt < OTP_SEND_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function markOtpSent(): void {
  try {
    sessionStorage.setItem(OTP_SENT_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

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
  const [sentOnce, setSentOnce] = useState(() =>
    typeof window !== "undefined" ? recentlySentOtp() : false
  );
  const autoSendStarted = useRef(false);
  const verifyingRef = useRef(false);

  function showError(value: unknown, fallback: string) {
    setError(authErrorMessage(value, fallback));
  }

  async function sendOtpEmail(options?: {
    force?: boolean;
  }): Promise<boolean> {
    if (!options?.force && recentlySentOtp()) {
      setSentOnce(true);
      setInfo(
        "Check your email — use the 6-digit code if shown, or click the secure link in the same message."
      );
      return true;
    }

    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      showError(
        userError,
        "You must be signed in to receive a code. Sign in again."
      );
      return false;
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: user.email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: emailOtpRedirectTo(),
      },
    });

    if (otpError) {
      // Remount rate-limits should not look like a verify failure.
      showError(
        otpError,
        "Could not send the sign-in email. Try again in a minute."
      );
      return false;
    }

    markOtpSent();
    return true;
  }

  useEffect(() => {
    if (autoSendStarted.current) return;
    autoSendStarted.current = true;

    startSend(async () => {
      try {
        const ok = await sendOtpEmail();
        if (!ok) return;
        setSentOnce(true);
        setInfo(
          "Check your email — use the 6-digit code if shown, or click the secure link in the same message."
        );
      } catch (err) {
        if (verifyingRef.current) return;
        showError(err, "Could not send the sign-in email. Try Resend.");
      }
    });
    // Intentionally once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resend() {
    if (verifyingRef.current) return;
    setError(null);
    startSend(async () => {
      try {
        const ok = await sendOtpEmail({ force: true });
        if (!ok) return;
        setSentOnce(true);
        setInfo("A new email is on the way — code or link both work.");
      } catch (err) {
        showError(err, "Could not send the sign-in email. Try again in a minute.");
      }
    });
  }

  function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (verifyingRef.current) return;

    setError(null);
    verifyingRef.current = true;

    startVerify(async () => {
      try {
        const trimmed = code.trim();
        if (!/^\d{6,8}$/.test(trimmed)) {
          setError("Enter the 6-digit code from your email.");
          return;
        }

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.email) {
          setError("Session expired. Sign in again.");
          return;
        }

        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: user.email,
          token: trimmed,
          type: "email",
        });

        if (verifyError) {
          showError(verifyError, "Invalid or expired code. Try again.");
          return;
        }

        const result = await markAdminEmailMfaSatisfiedAction();
        if (!result || result.ok !== true) {
          showError(
            result && "error" in result ? result.error : null,
            "Could not finish sign-in. Try again."
          );
          return;
        }

        // Prevent remount auto-send from racing the redirect.
        markOtpSent();

        if (stayOnPage) {
          router.replace(AUTH_ROUTES.adminHome);
          router.refresh();
          return;
        }

        const {
          data: { user: verifiedUser },
        } = await supabase.auth.getUser();
        if (!verifiedUser) {
          setError("Session expired. Sign in again.");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, is_active, can_drive")
          .eq("id", verifiedUser.id)
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
      } catch (err) {
        showError(err, "Could not verify that code. Try again.");
      } finally {
        verifyingRef.current = false;
      }
    });
  }

  const errorText =
    typeof error === "string" &&
    error.trim() &&
    error.trim() !== "{}" &&
    error.trim() !== "[object Object]"
      ? error.trim()
      : null;

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
    <form onSubmit={handleVerify} className="space-y-4" noValidate>
      <p className="text-sm text-stone-600">
        We emailed a one-time login confirmation. Enter the{" "}
        <strong className="font-medium text-stone-800">6-digit code</strong> if
        your email shows one, or{" "}
        <strong className="font-medium text-stone-800">
          click the secure link
        </strong>{" "}
        in that same email — either finishes this step.
      </p>

      {info ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {info}
        </p>
      ) : null}

      {errorText ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorText}
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
        disabled={sending || verifying}
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
