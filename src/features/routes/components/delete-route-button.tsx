"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteRouteAction } from "@/features/routes/actions";

export function DeleteRouteButton({
  routeId,
  routeName,
  dogCount,
}: {
  routeId: string;
  routeName: string;
  dogCount: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const dogNote =
      dogCount > 0
        ? ` ${dogCount} dog${dogCount === 1 ? "" : "s"} will be unassigned.`
        : "";
    const confirmed = window.confirm(
      `Delete route “${routeName}”?${dogNote} Upcoming scheduled stops for this route will be cancelled. Past hikes are kept for history.`
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteRouteAction(routeId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 active:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete route"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
