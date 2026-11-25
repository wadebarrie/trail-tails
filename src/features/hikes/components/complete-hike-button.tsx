"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/features/admin/components/confirm-dialog";
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
  const [open, setOpen] = useState(false);

  if (status === "completed") {
    return <HikeStatusBadge status={status} />;
  }

  function handleComplete() {
    setError(null);
    startTransition(async () => {
      const result = await completeHikeAction(hikeId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  const label =
    status === "in_progress" ? "Mark hike complete" : "Close out hike";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setOpen(true)}
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
      <ConfirmDialog
        open={open}
        title={label}
        body="Open stops will be marked picked up or dropped off. If gallery texts are on, each owner with tagged photos gets one text for that day's photos."
        confirmLabel={label}
        pending={pending}
        onCancel={() => {
          if (!pending) setOpen(false);
        }}
        onConfirm={handleComplete}
      />
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
