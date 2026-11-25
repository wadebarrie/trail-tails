"use client";

import { useActionState, useRef, useState } from "react";
import { ConfirmDialog } from "@/features/admin/components/confirm-dialog";
import { secondaryButtonClassName } from "@/features/admin/components/button-styles";
import { bulkCloseOutHikesFormAction } from "@/features/hikes/actions";

type CloseOutResult = {
  success?: true;
  closed?: number;
  error?: string;
} | null;

export function BulkCloseOutButton({
  start,
  end,
  notClosedOutDays,
  galleryTextsOn,
}: {
  start: string;
  end: string;
  notClosedOutDays: number;
  galleryTextsOn: boolean;
}) {
  const [state, formAction, pending] = useActionState<CloseOutResult, FormData>(
    bulkCloseOutHikesFormAction,
    null
  );
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const routes =
    notClosedOutDays === 1
      ? "1 incomplete route"
      : `${notClosedOutDays} incomplete routes`;

  const warning = galleryTextsOn
    ? `Close out ${routes} in this range? Open stops will be marked picked up or dropped off. Gallery texts will go out to owners who have tagged photos and have not already received the link.`
    : `Close out ${routes} in this range? Open stops will be marked picked up or dropped off. Gallery texts are off in Settings, so owners will not be texted.`;

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-3 flex flex-col items-start gap-2"
    >
      <input type="hidden" name="start" value={start} />
      <input type="hidden" name="end" value={end} />
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className={`${secondaryButtonClassName} border-amber-300 bg-white text-amber-950 hover:bg-amber-100`}
      >
        {pending ? "Closing out…" : `Close out ${routes} in this range`}
      </button>
      <p className="text-xs text-amber-900">
        Open stops become picked up / dropped off. Skip or cancel no-shows on
        Today first if a dog did not hike.
        {galleryTextsOn
          ? " Gallery texts go out for tagged photos."
          : " Gallery texts are off in Settings."}
      </p>
      {state?.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p role="status" className="text-sm text-green-800">
          Closed out {state.closed ?? 0} route
          {(state.closed ?? 0) === 1 ? "" : "s"}. Billable totals will refresh.
        </p>
      ) : null}
      <ConfirmDialog
        open={open}
        title={`Close out ${routes}`}
        body={warning}
        confirmLabel={`Close out ${notClosedOutDays}`}
        pending={pending}
        onCancel={() => {
          if (!pending) setOpen(false);
        }}
        onConfirm={() => {
          formRef.current?.requestSubmit();
          setOpen(false);
        }}
      />
    </form>
  );
}
