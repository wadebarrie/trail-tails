"use client";

import Link from "next/link";
import { ONBOARDING_SUPPORT } from "@/features/onboarding/constants";

export function OnboardingSupportCard({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <aside
      className={`rounded-xl border border-[var(--color-trail-100)] bg-[var(--color-trail-50)] ${
        compact ? "px-3 py-2.5" : "px-4 py-3"
      }`}
    >
      <p
        className={`font-medium text-[var(--color-trail-900)] ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        Need help onboarding?
      </p>
      <p
        className={`mt-1 text-[var(--color-trail-800)] ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {ONBOARDING_SUPPORT.blurb}
      </p>
      <p className={`mt-2 flex flex-wrap gap-x-3 gap-y-1 ${compact ? "text-xs" : "text-sm"}`}>
        <a
          href={`mailto:${ONBOARDING_SUPPORT.email}?subject=PackRoute%20onboarding%20help`}
          className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
        >
          Email {ONBOARDING_SUPPORT.email}
        </a>
        <Link
          href={ONBOARDING_SUPPORT.contactPath}
          className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
        >
          Contact form
        </Link>
      </p>
    </aside>
  );
}
