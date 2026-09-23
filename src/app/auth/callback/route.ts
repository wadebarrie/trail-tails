import {
  canAccessAdmin,
  getLoginRedirect,
} from "@/features/auth/access";
import { AUTH_ROUTES, getHomeRouteForRole } from "@/features/auth/constants";
import { getCurrentProfile } from "@/features/auth/queries";
import { buildAdminEmailMfaCookie } from "@/lib/auth/admin-email-mfa";
import { createClient } from "@/lib/supabase/server";
import { safeAuthNextPath } from "@/lib/auth/safe-redirect";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const mfaStepUp = searchParams.get("mfa") === "1";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const profile = await getCurrentProfile();

  const fallback = profile
    ? getHomeRouteForRole(profile.role)
    : AUTH_ROUTES.login;

  const destination =
    nextParam && profile
      ? getLoginRedirect(profile, safeAuthNextPath(nextParam, fallback))
      : nextParam
        ? safeAuthNextPath(nextParam, fallback)
        : fallback;

  const response = NextResponse.redirect(`${origin}${destination}`);

  // Magic-link confirmation counts as the admin second factor.
  // Attach cookie on the redirect response (cookies().set alone can be lost).
  if (mfaStepUp && profile && canAccessAdmin(profile)) {
    const cookie = buildAdminEmailMfaCookie(profile.id);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  return response;
}
