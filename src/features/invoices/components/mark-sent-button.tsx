"use client";

import { useActionState } from "react";
import { FormSubmitButton } from "@/features/admin/components/form-submit-button";
import { markInvoiceSentFormAction } from "@/features/invoices/actions";
import type { InvoiceActionResult } from "@/features/invoices/actions";

export function MarkSentButton({ invoiceId }: { invoiceId: string }) {
  const [state, formAction] = useActionState<InvoiceActionResult | null>(
    markInvoiceSentFormAction.bind(null, invoiceId),
    null
  );

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <FormSubmitButton pendingLabel="Saving…">Mark as sent</FormSubmitButton>
      {state?.ok === false ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
