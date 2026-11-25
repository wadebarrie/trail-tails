"use client";

import { useActionState } from "react";
import { FormSubmitButton } from "@/features/admin/components/form-submit-button";
import { sendInvoiceFormAction } from "@/features/invoices/actions";
import type { InvoiceActionResult } from "@/features/invoices/actions";

export function SendInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [state, formAction] = useActionState<InvoiceActionResult | null>(
    sendInvoiceFormAction.bind(null, invoiceId),
    null
  );

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <FormSubmitButton pendingLabel="Sending…">Send invoice</FormSubmitButton>
      {state?.ok === false ? (
        <p role="alert" className="max-w-xs text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state?.ok && state.message ? (
        <p className="max-w-xs text-sm text-stone-600">{state.message}</p>
      ) : null}
    </form>
  );
}
