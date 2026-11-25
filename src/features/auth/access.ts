import type { Profile } from "@/types";
import { AUTH_ROUTES, DRIVER_PATH_PREFIXES } from "@/features/auth/constants";
import { safeAuthNextPath } from "@/lib/auth/safe-redirect";

type AccessProfile = Pick<Profile, "role" | "is_active" | "can_drive">;

export function canAccessAdmin(profile: AccessProfile): boolean {
  return profile.is_active && profile.role === "admin";
}

export function canAccessDriver(profile: AccessProfile): boolean {
  return (
    profile.is_active &&
    (profile.role === "driver" ||
      (profile.role === "admin" && profile.can_drive))
  );
}

/** Admin account that can also use the driver mobile view. */
export function hasDualAccess(profile: Pick<Profile, "role" | "can_drive">): boolean {
  return profile.role === "admin" && profile.can_drive;
}

export function canAccessPlatform(
  profile: Pick<Profile, "is_active" | "is_platform_owner">
): boolean {
  return profile.is_active && profile.is_platform_owner;
}

export function getDefaultHomeRoute(profile: Pick<Profile, "role">): string {
  return profile.role === "driver" ? "/today" : "/dashboard";
}

/** Recovery links must reach the reset form, and nowhere else under that name. */
export function passwordResetRedirect(next: string | null | undefined): string | null {
  if (!next) return null;
  const safe = safeAuthNextPath(next, "");
  if (
    safe === AUTH_ROUTES.resetPassword ||
    safe === `${AUTH_ROUTES.resetPassword}/`
  ) {
    return AUTH_ROUTES.resetPassword;
  }
  return null;
}

export function getLoginRedirect(
  profile: AccessProfile,
  next?: string
): string {
  const reset = passwordResetRedirect(next);
  if (reset) return reset;

  if (next?.startsWith("/dashboard") && canAccessAdmin(profile)) {
    return next;
  }
  if (
    next &&
    DRIVER_PATH_PREFIXES.some((p) => next.startsWith(p)) &&
    canAccessDriver(profile)
  ) {
    return next;
  }
  return getDefaultHomeRoute(profile);
}
