import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";
import { AUTH_ROUTES, getHomeRouteForRole } from "@/features/auth/constants";
import { getCurrentProfile } from "@/features/auth/queries";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; next?: string; error?: string }>;
}) {
  const { role, next, error } = await searchParams;
  const profile = await getCurrentProfile();

  if (profile?.is_active) {
    redirect(getHomeRouteForRole(profile.role));
  }

  const isDriverHint = role === "driver";

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-[var(--color-trail-800)]">
        Sign in
      </h1>
      <p className="mt-1 text-sm text-stone-600">
        {isDriverHint ? "Driver mobile access" : "Office admin dashboard"}
      </p>

      {error === "no_profile" ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Account setup is incomplete. Contact the office for help.
        </p>
      ) : null}

      <LoginForm nextPath={next && next !== AUTH_ROUTES.login ? next : undefined} />
    </div>
  );
}
