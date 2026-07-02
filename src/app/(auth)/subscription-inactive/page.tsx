import Link from "next/link";
import { AUTH_ROUTES } from "@/features/auth/constants";
import { SITE_CONTACT_EMAIL } from "@/lib/seo/metadata";

export default function SubscriptionInactivePage() {
  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-semibold text-[var(--color-trail-800)]">
        Subscription inactive
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-600">
        Your company&apos;s PackRoute subscription is not active. Team members
        cannot use the dashboard or driver app until billing is restored.
      </p>
      <p className="mt-3 text-sm text-stone-600">
        Contact us at{" "}
        <a
          href={`mailto:${SITE_CONTACT_EMAIL}`}
          className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
        >
          {SITE_CONTACT_EMAIL}
        </a>{" "}
        or use the{" "}
        <Link
          href="/contact"
          className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
        >
          contact form
        </Link>{" "}
        to reactivate your account.
      </p>
      <Link
        href={AUTH_ROUTES.login}
        className="mt-6 inline-flex text-sm font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
      >
        Back to sign in
      </Link>
    </div>
  );
}
