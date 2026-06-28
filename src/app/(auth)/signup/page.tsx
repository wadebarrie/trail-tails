import Link from "next/link";
import { SignupForm } from "@/features/platform/components/signup-form";
import { getInvitePreviewByToken } from "@/features/platform/queries";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-[var(--color-trail-800)]">
          Invite required
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          PackRoute is invite-only during beta. Ask for an invite link from the
          PackRoute team.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-[var(--color-trail-700)] hover:underline"
        >
          Already have an account? Sign in
        </Link>
      </div>
    );
  }

  const preview = await getInvitePreviewByToken(token);

  if (!preview) {
    return (
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-[var(--color-trail-800)]">
          Invalid invite
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          This invite link is not valid. Request a new one from the PackRoute team.
        </p>
      </div>
    );
  }

  if (preview.used) {
    return (
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-[var(--color-trail-800)]">
          Invite already used
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          This invite has already been accepted.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-[var(--color-trail-700)] hover:underline"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (preview.expired) {
    return (
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-[var(--color-trail-800)]">
          Invite expired
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          This invite link has expired. Ask for a new one from the PackRoute team.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-[var(--color-trail-800)]">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-stone-600">
        Set a password for {preview.companyName}.
      </p>
      <SignupForm token={token} preview={preview} />
    </div>
  );
}
