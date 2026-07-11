import { getLoginRedirect } from "@/features/auth/access";
import { AUTH_ROUTES, getHomeRouteForRole } from "@/features/auth/constants";
import { getCurrentProfile } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import { safeAuthNextPath } from "@/lib/auth/safe-redirect";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const profile = await getCurrentProfile();
  const fallback = profile
    ? getHomeRouteForRole(profile.role)
    : AUTH_ROUTES.login;

  if (nextParam) {
    const safeNext = safeAuthNextPath(nextParam, fallback);
    const next = profile ? getLoginRedirect(profile, safeNext) : safeNext;
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}${fallback}`);
}
