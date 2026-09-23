import { NextResponse } from "next/server";
import { canAccessAdmin } from "@/features/auth/access";
import { getCurrentProfile } from "@/features/auth/queries";
import {
  ADMIN_EMAIL_MFA_COOKIE,
  buildAdminEmailMfaCookie,
} from "@/lib/auth/admin-email-mfa";
import { createClient } from "@/lib/supabase/server";
import { authErrorMessage } from "@/features/auth/lib/auth-error-message";
import { logWarn } from "@/lib/logger";

export type MfaEmailApiResult = { ok: true } | { ok: false; error: string };

/** Mark this browser session as email-MFA satisfied (sets httpOnly cookie). */
export async function POST(): Promise<NextResponse<MfaEmailApiResult>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json(
        { ok: false, error: "Session expired. Sign in again." },
        { status: 401 }
      );
    }

    const profile = await getCurrentProfile();
    if (!profile || !canAccessAdmin(profile)) {
      return NextResponse.json(
        { ok: false, error: "Admin access required." },
        { status: 403 }
      );
    }

    const response = NextResponse.json({ ok: true } satisfies MfaEmailApiResult);
    const cookie = buildAdminEmailMfaCookie(user.id);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    logWarn(
      "system",
      `MFA email cookie API threw: ${authErrorMessage(error, "unknown")}`
    );
    return NextResponse.json(
      {
        ok: false,
        error: authErrorMessage(error, "Could not finish sign-in. Try again."),
      },
      { status: 500 }
    );
  }
}

/** Clear the email-MFA cookie (sign-out). */
export async function DELETE(): Promise<NextResponse<MfaEmailApiResult>> {
  const response = NextResponse.json({ ok: true } satisfies MfaEmailApiResult);
  response.cookies.set(ADMIN_EMAIL_MFA_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
