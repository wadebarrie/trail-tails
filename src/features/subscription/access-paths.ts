import { AUTH_ROUTES } from "@/features/auth/constants";

/** Authenticated paths reachable when subscription access is blocked. */
export const SUBSCRIPTION_EXEMPT_PATHS = new Set([
  "/subscription-inactive",
  AUTH_ROUTES.login,
  AUTH_ROUTES.forgotPassword,
  AUTH_ROUTES.resetPassword,
]);

export function isSubscriptionExemptPath(pathname: string): boolean {
  return SUBSCRIPTION_EXEMPT_PATHS.has(pathname);
}
