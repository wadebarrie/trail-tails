import { canAccessAdmin } from "@/features/auth/access";
import { AUTH_ROUTES, getHomeRouteForRole } from "@/features/auth/constants";
import { authCallbackDestination } from "@/features/auth/signup-guards";
import { readOnboardingGate } from "@/features/onboarding/gate";
import { getCurrentProfile } from "@/features/auth/queries";
import { provisionConfirmedSelfSignup } from "@/features/onboarding/self-signup.server";
import { buildAdminEmailMfaCookie } from "@/lib/auth/admin-email-mfa";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const mfaStepUp = searchParams.get("mfa") === "1";

  const supabase = await createClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email_confirmed_at) {
    await provisionConfirmedSelfSignup(user.id);
  }

  const profile = await getCurrentProfile();

  const fallback = profile
    ? getHomeRouteForRole(profile.role)
    : AUTH_ROUTES.login;

  let onboardingCompletedAt: string | null = "complete";
  let onboardingDismissedAt: string | null = null;
  if (profile?.role === "admin") {
    const gate = await readOnboardingGate(supabase, profile.company_id);
    onboardingCompletedAt = gate.completedAt;
    onboardingDismissedAt = gate.dismissedAt;
  }

  const destination = profile
    ? authCallbackDestination({
        role: profile.role,
        canDrive: profile.can_drive,
        onboardingCompletedAt,
        onboardingDismissedAt,
        nextParam,
        fallback,
      })
    : `${AUTH_ROUTES.login}?error=no_profile`;

  const response = NextResponse.redirect(`${origin}${destination}`);

  // Magic-link confirmation counts as the admin second factor.
  // Attach cookie on the redirect response (cookies().set alone can be lost).
  if (mfaStepUp && profile && canAccessAdmin(profile)) {
    const cookie = buildAdminEmailMfaCookie(profile.id);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  return response;
}
