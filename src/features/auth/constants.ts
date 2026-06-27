import type { UserRole } from "@/types";

export const AUTH_ROUTES = {
  login: "/login",
  adminHome: "/dashboard",
  driverHome: "/today",
} as const;

export const DRIVER_PATH_PREFIXES = ["/today", "/tomorrow", "/help"] as const;

export function getHomeRouteForRole(role: UserRole): string {
  return role === "driver" ? AUTH_ROUTES.driverHome : AUTH_ROUTES.adminHome;
}

export function getSafeRedirect(role: UserRole, next?: string): string {
  if (role === "admin" && next?.startsWith("/dashboard")) return next;
  if (
    role === "driver" &&
    next &&
    DRIVER_PATH_PREFIXES.some((p) => next.startsWith(p))
  ) {
    return next;
  }
  return getHomeRouteForRole(role);
}

/** Paths that never require authentication */
export const PUBLIC_PATHS = new Set(["/", AUTH_ROUTES.login]);

/** Path prefixes accessible without auth (webhooks, health) */
export const PUBLIC_PREFIXES = ["/api/health", "/api/webhooks", "/auth/callback"];

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isAdminPath(pathname: string): boolean {
  return pathname.startsWith(AUTH_ROUTES.adminHome);
}

export function isDriverPath(pathname: string): boolean {
  return DRIVER_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
