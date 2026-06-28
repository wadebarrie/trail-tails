import type { Profile, UserRole } from "@/types";
import { DRIVER_PATH_PREFIXES } from "@/features/auth/constants";

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

export function getLoginRedirect(
  profile: Pick<Profile, "role" | "can_drive">,
  next?: string
): string {
  if (next?.startsWith("/dashboard") && canAccessAdmin(profile as AccessProfile)) {
    return next;
  }
  if (
    next &&
    DRIVER_PATH_PREFIXES.some((p) => next.startsWith(p)) &&
    canAccessDriver(profile as AccessProfile)
  ) {
    return next;
  }
  return getDefaultHomeRoute(profile);
}
