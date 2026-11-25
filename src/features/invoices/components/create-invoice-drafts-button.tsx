"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FormSubmitButton } from "@/features/admin/components/form-submit-button";
import { createInvoiceDraftsFormAction } from "@/features/invoices/actions";
import type { InvoiceActionResult } from "@/features/invoices/actions";

export function CreateInvoiceDraftsButton({
  start,
  end,
}: {
  start: string;
  end: string;
}) {
  const [state, formAction] = useActionState<InvoiceActionResult | null, FormData>(
    createInvoiceDraftsFormAction,
    null
  );

  const needsCloseOut =
    state?.ok === false && state.error.toLowerCase().includes("close-out");

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="start" value={start} />
      <input type="hidden" name="end" value={end} />
      <FormSubmitButton pendingLabel="Creating drafts…">
        Create invoice drafts
      </FormSubmitButton>
      {state?.ok === false ? (
        <div role="alert" className="max-w-lg space-y-1 text-sm text-red-700">
          <p>{state.error}</p>
          {needsCloseOut ? (
            <p>
              Scroll up to the amber banner and use{" "}
              <span className="font-medium">Close out</span> for this range,
              then try again.
            </p>
          ) : null}
        </div>
      ) : null}
      {state?.ok ? (
        <p role="status" className="text-sm text-green-800">
          {state.message}{" "}
          <Link
            href="/dashboard/invoices"
            className="font-medium underline-offset-2 hover:underline"
          >
            View invoices
          </Link>
        </p>
      ) : null}
    </form>
  );
}
