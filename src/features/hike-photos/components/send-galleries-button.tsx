"use client";

import { useActionState } from "react";
import { FormSubmitButton } from "@/features/admin/components/form-submit-button";
import {
  sendTodaysGalleriesFormAction,
  type SendGalleriesResult,
} from "@/features/hike-photos/actions";

export function SendGalleriesButton({
  date,
  unsentCount,
}: {
  date: string;
  unsentCount: number;
}) {
  const [state, formAction] = useActionState<SendGalleriesResult | null>(
    sendTodaysGalleriesFormAction.bind(null, date),
    null
  );

  const label =
    unsentCount === 0
      ? "All galleries sent"
      : `Send ${unsentCount} unsent galler${unsentCount === 1 ? "y" : "ies"}`;

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <FormSubmitButton pendingLabel="Sending…" disabled={unsentCount === 0}>
        {label}
      </FormSubmitButton>
      {state?.ok === false ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="text-sm text-green-800">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
