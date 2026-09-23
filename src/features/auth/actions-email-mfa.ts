"use server";

import { headers } from "next/headers";
import {
  clearAdminEmailMfaCookie,
  setAdminEmailMfaCookie,
} from "@/lib/auth/admin-email-mfa";
import { createClient } from "@/lib/supabase/server";
import { logWarn } from "@/lib/logger";
import { getSiteUrl } from "@/lib/site-url";

export type EmailOtpResult = { ok: true } | { ok: false; error: string };

function authErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;
  if (typeof error === "string" && error.trim()) return error.trim();
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      const lower = message.toLowerCase();
      if (lower.includes("rate") || lower.includes("seconds")) {
        return "Please wait a moment before requesting another code.";
      }
      if (lower.includes("redirect") || lower.includes("whitelist")) {
        return "Sign-in email could not be sent (redirect URL not allowed). Contact support.";
      }
      if (lower.includes("smtp") || lower.includes("sending")) {
        return "We could not send the email right now. Check spam, wait a minute, or contact support.";
      }
      return message.trim();
    }
  }
  return fallback;
}

/**
 * Prefer localhost for local MFA emails; otherwise use the canonical site URL
 * so Supabase redirect allow-lists stay predictable.
 */
async function emailOtpRedirectUrl(): Promise<string> {
  const site = getSiteUrl();
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0]?.trim();

  const isLocal =
    host === "localhost:3000" ||
    host === "127.0.0.1:3000" ||
    host.startsWith("localhost:") ||
    host.startsWith("127.0.0.1:");

  const base = isLocal ? `http://${host}` : site;
  const next = encodeURIComponent("/dashboard");
  return `${base}/auth/callback?next=${next}&mfa=1`;
}

/** Send a one-time code to the signed-in admin's email (Supabase Auth email OTP). */
export async function sendAdminEmailOtpAction(): Promise<EmailOtpResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return { ok: false, error: "You must be signed in to receive a code." };
    }

    const emailRedirectTo = await emailOtpRedirectUrl();
    const { error } = await supabase.auth.signInWithOtp({
      email: user.email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo,
      },
    });

    if (error) {
      logWarn(
        "auth",
        `Email OTP send failed for ${user.email}: ${authErrorMessage(error, "unknown")} (redirect=${emailRedirectTo})`
      );
      return {
        ok: false,
        error: authErrorMessage(
          error,
          "Could not send the sign-in email. Try again in a minute."
        ),
      };
    }

    return { ok: true };
  } catch (error) {
    logWarn("auth", `Email OTP send threw: ${authErrorMessage(error, "unknown")}`);
    return {
      ok: false,
      error: authErrorMessage(
        error,
        "Could not send the sign-in email. Try again in a minute."
      ),
    };
  }
}

/** Verify email OTP and mark this browser session as MFA-satisfied. */
export async function verifyAdminEmailOtpAction(
  code: string
): Promise<EmailOtpResult> {
  try {
    const trimmed = code.trim();
    if (!/^\d{6,8}$/.test(trimmed)) {
      return { ok: false, error: "Enter the 6-digit code from your email." };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return { ok: false, error: "Session expired. Sign in again." };
    }

    const { error } = await supabase.auth.verifyOtp({
      email: user.email,
      token: trimmed,
      type: "email",
    });

    if (error) {
      return { ok: false, error: "Invalid or expired code. Try again." };
    }

    const {
      data: { user: verifiedUser },
    } = await supabase.auth.getUser();

    if (!verifiedUser?.id) {
      return { ok: false, error: "Session expired. Sign in again." };
    }

    await setAdminEmailMfaCookie(verifiedUser.id);
    return { ok: true };
  } catch (error) {
    logWarn("auth", `Email OTP verify threw: ${authErrorMessage(error, "unknown")}`);
    return {
      ok: false,
      error: authErrorMessage(error, "Could not verify that code. Try again."),
    };
  }
}

export async function clearAdminEmailMfaAction(): Promise<void> {
  await clearAdminEmailMfaCookie();
}
