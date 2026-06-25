import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey } from "@/lib/env";
import type { UserRole } from "@/types";
import { canAccessAdmin, canAccessDriver } from "@/features/auth/access";
import {
  AUTH_ROUTES,
  getHomeRouteForRole,
  isAdminPath,
  isDriverPath,
  isPublicPath,
} from "@/features/auth/constants";

type ProfileRow = {
  role: UserRole;
  is_active: boolean;
  can_drive: boolean;
};

export async function handleAuth(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    if (user && pathname === AUTH_ROUTES.login) {
      const profile = await fetchProfile(supabase, user.id);
      if (profile?.is_active) {
        return redirectTo(request, getHomeRouteForRole(profile.role));
      }
    }
    return supabaseResponse;
  }

  if (!user) {
    return redirectToLogin(request, pathname);
  }

  const profile = await fetchProfile(supabase, user.id);

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return redirectToLogin(request, pathname);
  }

  if (isAdminPath(pathname) && !canAccessAdmin(profile)) {
    return redirectTo(request, getHomeRouteForRole(profile.role));
  }

  if (isDriverPath(pathname) && !canAccessDriver(profile)) {
    return redirectTo(request, getHomeRouteForRole(profile.role));
  }

  return supabaseResponse;
}

async function fetchProfile(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<ProfileRow | null> {
  const { data } = await supabase
    .from("profiles")
    .select("role, is_active, can_drive")
    .eq("id", userId)
    .maybeSingle();

  return data as ProfileRow | null;
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

function redirectToLogin(request: NextRequest, from: string) {
  const url = request.nextUrl.clone();
  url.pathname = AUTH_ROUTES.login;
  url.search = "";
  if (from !== AUTH_ROUTES.login && from !== "/") {
    url.searchParams.set("next", from);
  }
  return NextResponse.redirect(url);
}
