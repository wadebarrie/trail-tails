import Link from "next/link";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { AUTH_ROUTES } from "@/features/auth/constants";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`${AUTH_ROUTES.forgotPassword}?error=expired`);
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-[var(--color-trail-800)]">
        Choose a new password
      </h1>
      <p className="mt-1 text-sm text-stone-600">
        Signed in as <strong>{user.email}</strong>. You&apos;ll sign in again after
        updating.
      </p>
      <ResetPasswordForm />
    </div>
  );
}
