"use client";

import { useActionState } from "react";
import { FormSubmitButton } from "@/features/admin/components/form-submit-button";
import {
  sendTodaysGalleriesFormAction,
  type SendGalleriesResult,
} from "@/features/hike-photos/actions";

export function SendGalleriesButton({
  date,
  ownerCount,
}: {
  date: string;
  ownerCount: number;
}) {
  const [state, formAction] = useActionState<SendGalleriesResult | null>(
    sendTodaysGalleriesFormAction.bind(null, date),
    null
  );

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <FormSubmitButton pendingLabel="Sending…">
        Send today&apos;s galleries
        {ownerCount > 0 ? ` (${ownerCount} owner${ownerCount === 1 ? "" : "s"})` : ""}
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
