"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PAID_TIER_CATALOG } from "@/features/subscription/paid-tiers";
import type { PaidTierId } from "@/features/subscription/paid-tiers";
import { createCheckoutSessionAction } from "@/features/subscription/actions";
import { landingPrimaryButtonClassName } from "@/features/admin/components/button-styles";

export function SubscribeTierButtons({
  disabledReason,
}: {
  disabledReason?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingTier, setPendingTier] = useState<PaidTierId | null>(null);
  const [pending, startTransition] = useTransition();

  function subscribe(tierId: PaidTierId) {
    if (disabledReason) {
      setError(disabledReason);
      return;
    }
    setError(null);
    setPendingTier(tierId);
    startTransition(async () => {
      const result = await createCheckoutSessionAction(tierId, "monthly");
      setPendingTier(null);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {disabledReason ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {disabledReason}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        {PAID_TIER_CATALOG.map((tier) => (
          <div
            key={tier.tierId}
            className={`flex flex-col rounded-xl border bg-white p-4 ${
              tier.highlight
                ? "border-[var(--color-trail-600)] ring-1 ring-[var(--color-trail-600)]"
                : "border-stone-200"
            }`}
          >
            {tier.badge ? (
              <p className="text-xs font-medium text-[var(--color-trail-700)]">
                {tier.badge}
              </p>
            ) : null}
            <p className="mt-1 font-semibold text-stone-900">{tier.name}</p>
            <p className="mt-1 text-2xl font-semibold text-stone-900">
              ${tier.monthlyPriceUsd}
              <span className="text-sm font-normal text-stone-500">/mo</span>
            </p>
            <p className="mt-2 text-xs text-stone-500">{tier.hikers}</p>
            <p className="text-xs text-stone-500">{tier.dogs}</p>
            <button
              type="button"
              disabled={pending || Boolean(disabledReason)}
              onClick={() => subscribe(tier.tierId)}
              className={`${landingPrimaryButtonClassName} mt-4 w-full justify-center text-sm disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {pending && pendingTier === tier.tierId
                ? "Redirecting…"
                : "Subscribe"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
