import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getHomeRouteForRole } from "@/features/auth/constants";
import { getCurrentProfile } from "@/features/auth/queries";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const profile = await getCurrentProfile();
  const next =
    searchParams.get("next") ??
    (profile ? getHomeRouteForRole(profile.role) : "/login");

  return NextResponse.redirect(`${origin}${next}`);
}
