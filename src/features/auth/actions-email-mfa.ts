"use server";

import { headers } from "next/headers";
import {
  clearAdminEmailMfaCookie,
  setAdminEmailMfaCookie,
} from "@/lib/auth/admin-email-mfa";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export type EmailOtpResult = { ok: true } | { ok: false; error: string };

/**
 * Prefer the host of the current request so local MFA emails don't send
 * magic links to production (NEXT_PUBLIC_APP_URL is often the deploy URL).
 */
async function emailOtpRedirectUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto =
    h.get("x-forwarded-proto") ??
    (host?.includes("localhost") || host?.startsWith("127.") ? "http" : "https");

  const base = host ? `${proto}://${host}` : getSiteUrl();
  const next = encodeURIComponent("/dashboard");
  return `${base}/auth/callback?next=${next}&mfa=1`;
}

/** Send a one-time code to the signed-in admin's email (Supabase Auth email OTP). */
export async function sendAdminEmailOtpAction(): Promise<EmailOtpResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false, error: "You must be signed in to receive a code." };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: user.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: await emailOtpRedirectUrl(),
    },
  });

  if (error) {
    return {
      ok: false,
      error:
        error.message.includes("rate") || error.message.includes("seconds")
          ? "Please wait a moment before requesting another code."
          : error.message,
    };
  }

  return { ok: true };
}

/** Verify email OTP and mark this browser session as MFA-satisfied. */
export async function verifyAdminEmailOtpAction(
  code: string
): Promise<EmailOtpResult> {
  const trimmed = code.trim();
  if (!/^\d{6,8}$/.test(trimmed)) {
    return { ok: false, error: "Enter the code from your email." };
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
}

export async function clearAdminEmailMfaAction(): Promise<void> {
  await clearAdminEmailMfaCookie();
}
