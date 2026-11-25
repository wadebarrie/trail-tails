"use client";

import { useActionState, useRef, useState } from "react";
import { ConfirmDialog } from "@/features/admin/components/confirm-dialog";
import { secondaryButtonClassName } from "@/features/admin/components/button-styles";
import { bulkCloseOutConfirmBody } from "@/features/hike-photos/gallery-sms-rules";
import { bulkCloseOutHikesFormAction } from "@/features/hikes/actions";

type CloseOutResult = {
  success?: true;
  closed?: number;
  gallerySent?: number;
  galleryDeferred?: number;
  error?: string;
} | null;

export function BulkCloseOutButton({
  start,
  end,
  notClosedOutDays,
  galleryTextsOn,
  galleryRecipientCount,
}: {
  start: string;
  end: string;
  notClosedOutDays: number;
  galleryTextsOn: boolean;
  /** Owners with a gallery link on routes this action will close. Null if unknown. */
  galleryRecipientCount: number | null;
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

  const warning = bulkCloseOutConfirmBody({
    routeCount: notClosedOutDays,
    galleryTextsOn,
    galleryRecipientCount,
  });

  const sent = state?.gallerySent ?? 0;
  const deferred = state?.galleryDeferred ?? 0;

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
        This cannot be undone. Skip or cancel no-shows on Today first if a dog
        did not hike.
      </p>
      {state?.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
          {typeof state.closed === "number"
            ? ` ${state.closed} route${state.closed === 1 ? "" : "s"} were closed before the error.`
            : ""}
        </p>
      ) : null}
      {state?.success ? (
        <p role="status" className="text-sm text-green-800">
          Closed out {state.closed ?? 0} route
          {(state.closed ?? 0) === 1 ? "" : "s"}.
          {sent > 0
            ? ` Sent ${sent} gallery text${sent === 1 ? "" : "s"}.`
            : " No new gallery texts."}
          {deferred > 0
            ? " The text time limit was reached — send the rest from Hike photos."
            : ""}
        </p>
      ) : null}
      <ConfirmDialog
        open={open}
        title={`Close out ${routes}`}
        body={warning}
        confirmLabel={`Close out ${notClosedOutDays}`}
        pending={pending}
        pendingLabel="Closing out…"
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
