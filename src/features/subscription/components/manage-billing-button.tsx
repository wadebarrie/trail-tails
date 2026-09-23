"use client";

import { useState, useTransition } from "react";
import { createBillingPortalSessionAction } from "@/features/subscription/actions";
import { secondaryButtonClassName } from "@/features/admin/components/button-styles";

export function ManageBillingButton({
  disabledReason,
  returnTo = "/dashboard/settings",
}: {
  disabledReason?: string | null;
  returnTo?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openPortal() {
    if (disabledReason) {
      setError(disabledReason);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createBillingPortalSessionAction(returnTo);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={openPortal}
        disabled={pending || Boolean(disabledReason)}
        className={`${secondaryButtonClassName} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {pending ? "Opening…" : "Manage billing"}
      </button>
      {disabledReason ? (
        <p className="text-xs text-stone-500">{disabledReason}</p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
