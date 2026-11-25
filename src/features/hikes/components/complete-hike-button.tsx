"use client";

import { useState } from "react";
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
  const [phase, setPhase] = useState<"idle" | "closing">("idle");
  const [closed, setClosed] = useState(status === "completed");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleComplete() {
    setError(null);
    setPhase("closing");
    const result = await completeHikeAction(hikeId);
    if (result.error) {
      setPhase("idle");
      setError(result.error);
      return;
    }

    setClosed(true);
    setOpen(false);
    setPhase("idle");
    if (result.message) setNotice(result.message);
    router.refresh();
  }

  const label =
    status === "in_progress" ? "Mark hike complete" : "Close out hike";

  if (closed && phase !== "closing") {
    return (
      <div className="flex flex-col items-end gap-1">
        <HikeStatusBadge status="completed" />
        {notice ? (
          <p className="max-w-xs text-right text-xs text-stone-600">{notice}</p>
        ) : null}
        {error ? (
          <p className="max-w-xs text-right text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={phase !== "idle"}
        className={secondaryButtonClassName}
      >
        {phase === "closing" ? "Closing out…" : label}
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
        pending={phase === "closing"}
        pendingLabel="Closing out…"
        onCancel={() => {
          if (phase === "idle") setOpen(false);
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
