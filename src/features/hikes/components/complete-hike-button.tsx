"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
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

  if (status === "completed") {
    return (
      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
        Completed
      </span>
    );
  }

  function handleComplete() {
    if (
      !confirm(
        "Mark this hike complete? Any open stops will be closed out as picked up / dropped off."
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await completeHikeAction(hikeId);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  const label =
    status === "in_progress" ? "Mark hike complete" : "Close out hike";

  return (
    <button
      type="button"
      onClick={handleComplete}
      disabled={pending}
      className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 disabled:opacity-50"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

export function HikeStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          Completed
        </span>
      );
    case "in_progress":
      return (
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
          In progress
        </span>
      );
    default:
      return (
        <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-700">
          Planned
        </span>
      );
  }
}
