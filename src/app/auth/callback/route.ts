import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { AUTH_ROUTES, getHomeRouteForRole } from "@/features/auth/constants";
import { getCurrentProfile } from "@/features/auth/queries";
import { safeAuthNextPath } from "@/lib/auth/safe-redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  if (nextParam) {
    const next = safeAuthNextPath(nextParam, AUTH_ROUTES.login);
    return NextResponse.redirect(`${origin}${next}`);
  }

  const profile = await getCurrentProfile();
  const next = profile ? getHomeRouteForRole(profile.role) : AUTH_ROUTES.login;

  return NextResponse.redirect(`${origin}${next}`);
}
