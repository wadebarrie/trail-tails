"use client";

import { useActionState } from "react";
import { FormSubmitButton } from "@/features/admin/components/form-submit-button";
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
}: {
  start: string;
  end: string;
  notClosedOutDays: number;
}) {
  const [state, formAction] = useActionState<CloseOutResult, FormData>(
    bulkCloseOutHikesFormAction,
    null
  );

  return (
    <form action={formAction} className="mt-3 flex flex-col items-start gap-2">
      <input type="hidden" name="start" value={start} />
      <input type="hidden" name="end" value={end} />
      <FormSubmitButton
        pendingLabel="Closing out…"
        className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-950 hover:bg-amber-100"
      >
        Close out {notClosedOutDays} incomplete route
        {notClosedOutDays === 1 ? "" : "s"} in this range
      </FormSubmitButton>
      <p className="text-xs text-amber-900">
        Open stops become picked up / dropped off. Skip or cancel no-shows on
        Today first if a dog did not hike.
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
    </form>
  );
}
