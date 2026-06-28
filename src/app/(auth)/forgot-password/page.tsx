import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-[var(--color-trail-800)]">
        Reset your password
      </h1>
      <p className="mt-1 text-sm text-stone-600">
        Enter your login email and we&apos;ll send a reset link.
      </p>

      {error === "expired" ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          That reset link has expired or was already used. Request a new one below.
        </p>
      ) : null}

      <ForgotPasswordForm />
    </div>
  );
}
