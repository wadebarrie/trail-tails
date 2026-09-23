"use server";

import {
  clearAdminEmailMfaCookie,
  setAdminEmailMfaCookie,
} from "@/lib/auth/admin-email-mfa";
import { createClient } from "@/lib/supabase/server";

export type EmailOtpResult = { ok: true } | { ok: false; error: string };

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
    options: { shouldCreateUser: false },
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
