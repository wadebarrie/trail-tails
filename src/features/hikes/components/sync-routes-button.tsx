"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncHikesForOffsetAction } from "@/features/hikes/actions";
import { secondaryButtonClassName } from "@/features/admin/components/button-styles";

export function SyncRoutesButton({ offsetDays }: { offsetDays: 0 | 1 }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSync() {
    setError(null);
    startTransition(async () => {
      const result = await syncHikesForOffsetAction(offsetDays);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <button
        type="button"
        onClick={handleSync}
        disabled={pending}
        className={secondaryButtonClassName}
      >
        {pending
          ? "Syncing…"
          : offsetDays === 0
            ? "Rebuild today's stops"
            : "Rebuild tomorrow's stops"}
      </button>
      {error ? (
        <p className="max-w-xs text-right text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
