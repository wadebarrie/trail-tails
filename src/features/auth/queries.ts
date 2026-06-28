import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types";
import { AUTH_ROUTES, getHomeRouteForRole } from "./constants";
import { canAccessAdmin, canAccessDriver } from "./access";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) return null;
  return {
    ...(profile as Profile),
    can_drive: (profile as Profile).can_drive ?? false,
    is_platform_owner: (profile as Profile).is_platform_owner ?? false,
  };
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!profile?.is_active) {
    redirect(AUTH_ROUTES.login);
  }

  return profile;
}

export async function requireRole(role: UserRole): Promise<Profile> {
  const profile = await requireProfile();

  if (role === "admin" && !canAccessAdmin(profile)) {
    redirect(getHomeRouteForRole(profile.role));
  }

  if (role === "driver" && !canAccessDriver(profile)) {
    redirect(getHomeRouteForRole(profile.role));
  }

  return profile;
}

/** Driver routes and actions — includes admins with can_drive. */
export async function requireDriverAccess(): Promise<Profile> {
  const profile = await requireProfile();

  if (!canAccessDriver(profile)) {
    redirect(getHomeRouteForRole(profile.role));
  }

  return profile;
}
