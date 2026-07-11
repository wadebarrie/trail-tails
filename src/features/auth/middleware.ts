import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey } from "@/lib/env";
import { PerfTimer } from "@/lib/perf";
import type { UserRole } from "@/types";
import { canAccessAdmin, canAccessDriver } from "@/features/auth/access";
import {
  AUTH_ROUTES,
  getHomeRouteForRole,
  isAdminPath,
  isDriverPath,
  isPlatformPath,
  isPublicPath,
} from "@/features/auth/constants";
import { isSubscriptionExemptPath } from "@/features/subscription/access-paths";
import { canAccessApplication } from "@/features/subscription/helpers";
import type { SubscriptionStatus } from "@/features/subscription/types";

type ProfileRow = {
  role: UserRole;
  is_active: boolean;
  can_drive: boolean;
  is_platform_owner: boolean;
  company_id: string;
};

export async function handleAuth(request: NextRequest) {
  const timer = new PerfTimer(`middleware ${request.nextUrl.pathname}`);
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Service misconfigured" },
      { status: 503 },
    );
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
  timer.mark("getUser");

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
  timer.mark("fetchProfile");

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return redirectToLogin(request, pathname);
  }

  if (isSubscriptionExemptPath(pathname)) {
    timer.end();
    return supabaseResponse;
  }

  if (!profile.is_platform_owner) {
    const subscription = await fetchCompanySubscription(supabase, profile.company_id);
    timer.mark("fetchSubscription");

    if (!subscription || !canAccessApplication(subscription)) {
      return redirectTo(request, "/subscription-inactive");
    }
  }

  if (isPlatformPath(pathname) && !profile.is_platform_owner) {
    return redirectTo(request, getHomeRouteForRole(profile.role));
  }

  if (isAdminPath(pathname) && !canAccessAdmin(profile)) {
    return redirectTo(request, getHomeRouteForRole(profile.role));
  }

  if (isDriverPath(pathname) && !canAccessDriver(profile)) {
    return redirectTo(request, getHomeRouteForRole(profile.role));
  }

  timer.end();
  return supabaseResponse;
}

async function fetchProfile(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, is_active, can_drive, is_platform_owner, company_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    role: data.role as UserRole,
    is_active: data.is_active,
    can_drive: data.can_drive ?? false,
    is_platform_owner: data.is_platform_owner ?? false,
    company_id: data.company_id as string,
  };
}

async function fetchCompanySubscription(
  supabase: ReturnType<typeof createServerClient>,
  companyId: string
): Promise<{ status: SubscriptionStatus; trial_starts_at: string | null; trial_ends_at: string | null } | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, trial_starts_at, trial_ends_at")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    status: data.status as SubscriptionStatus,
    trial_starts_at: data.trial_starts_at,
    trial_ends_at: data.trial_ends_at,
  };
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
