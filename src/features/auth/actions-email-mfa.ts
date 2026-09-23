"use server";

import {
  clearAdminEmailMfaCookie,
  setAdminEmailMfaCookie,
} from "@/lib/auth/admin-email-mfa";
import { createClient } from "@/lib/supabase/server";
import { logWarn } from "@/lib/logger";
import { authErrorMessage } from "@/features/auth/lib/auth-error-message";

export type EmailOtpResult = { ok: true } | { ok: false; error: string };

/**
 * After the browser verifies the email OTP, mark this session as MFA-satisfied.
 * OTP send/verify happen on the client so Auth errors stay readable.
 */
export async function markAdminEmailMfaSatisfiedAction(): Promise<EmailOtpResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return { ok: false, error: "Session expired. Sign in again." };
    }

    await setAdminEmailMfaCookie(user.id);
    return { ok: true };
  } catch (error) {
    logWarn(
      "system",
      `Email MFA cookie set threw: ${authErrorMessage(error, "unknown")}`
    );
    return {
      ok: false,
      error: authErrorMessage(error, "Could not finish sign-in. Try again."),
    };
  }
}

export async function clearAdminEmailMfaAction(): Promise<void> {
  await clearAdminEmailMfaCookie();
}
