import { canAccessAdmin } from "@/features/auth/access";
import { getCurrentProfile } from "@/features/auth/queries";
import { isAdminMfaSatisfied } from "@/features/auth/mfa";

/** Auth + MFA check for admin API routes. Returns profile or an error Response. */
export async function requireAdminApiAccess(): Promise<
  { profile: NonNullable<Awaited<ReturnType<typeof getCurrentProfile>>> } | { response: Response }
> {
  const profile = await getCurrentProfile();
  if (!profile?.is_active || !canAccessAdmin(profile)) {
    return { response: new Response("Unauthorized", { status: 401 }) };
  }

  if (!(await isAdminMfaSatisfied())) {
    return { response: new Response("MFA required", { status: 403 }) };
  }

  return { profile };
}
