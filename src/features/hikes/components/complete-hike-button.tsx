"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/features/admin/components/ui";
import { secondaryButtonClassName } from "@/features/admin/components/button-styles";
import { completeHikeAction } from "@/features/hikes/actions";

export function CompleteHikeButton({
  hikeId,
  status,
}: {
  hikeId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status === "completed") {
    return <HikeStatusBadge status={status} />;
  }

  function handleComplete() {
    if (
      !confirm(
        "Mark this hike complete? Any open stops will be closed out as picked up / dropped off."
      )
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await completeHikeAction(hikeId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const label =
    status === "in_progress" ? "Mark hike complete" : "Close out hike";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleComplete}
        disabled={pending}
        className={secondaryButtonClassName}
      >
        {pending ? "Saving…" : label}
      </button>
      {error ? (
        <p className="max-w-xs text-right text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function HikeStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <Badge tone="green">Completed</Badge>;
    case "in_progress":
      return <Badge tone="amber">In progress</Badge>;
    default:
      return <Badge tone="neutral">Planned</Badge>;
  }
}
