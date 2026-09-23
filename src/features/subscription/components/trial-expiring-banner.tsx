"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type TrialExpiringBannerProps = {
  daysRemaining: number;
};

function trialCopy(daysRemaining: number): string {
  if (daysRemaining <= 0) {
    return "Your free trial ends today.";
  }
  if (daysRemaining === 1) {
    return "Your free trial ends tomorrow.";
  }
  return `Your free trial ends in ${daysRemaining} days.`;
}

export function TrialExpiringBanner({ daysRemaining }: TrialExpiringBannerProps) {
  const pathname = usePathname();
  if (pathname?.startsWith("/dashboard/settings")) return null;

  const urgent = daysRemaining <= 3;
  const shellClass = urgent
    ? "mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    : "mb-4 rounded-xl border border-[var(--color-trail-200)] bg-[var(--color-trail-50)] px-4 py-3 text-sm text-[var(--color-trail-900)]";

  return (
    <div className={shellClass} role="status">
      {trialCopy(daysRemaining)} Add a payment method to keep PackRoute running
      after the trial.{" "}
      <Link
        href="/dashboard/settings"
        className="font-medium underline-offset-2 hover:underline"
      >
        Choose a plan
      </Link>
    </div>
  );
}
