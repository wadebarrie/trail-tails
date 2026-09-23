"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ONBOARDING_PATH } from "@/features/onboarding/constants";

export function OnboardingSetupBanner() {
  const pathname = usePathname();
  if (pathname?.startsWith(ONBOARDING_PATH)) return null;

  return (
    <div className="mb-4 rounded-xl border border-[var(--color-trail-200)] bg-[var(--color-trail-50)] px-4 py-3 text-sm text-[var(--color-trail-900)]">
      Finish your first-run setup so hikers, customers, and routes are ready.{" "}
      <Link
        href={ONBOARDING_PATH}
        className="font-medium underline-offset-2 hover:underline"
      >
        Continue setup
      </Link>
      {" · "}
      <Link
        href="/contact"
        className="font-medium underline-offset-2 hover:underline"
      >
        Get onboarding help
      </Link>
    </div>
  );
}
