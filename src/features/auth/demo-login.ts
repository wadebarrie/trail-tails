/**
 * Sales demo logins are marked in app_metadata by the service role.
 * Users can read app_metadata but cannot write it, so this is not a
 * self-serve MFA bypass.
 */
export function isDemoLogin(
  user: { app_metadata?: Record<string, unknown> | null } | null | undefined
): boolean {
  return user?.app_metadata?.demo_login === true;
}
