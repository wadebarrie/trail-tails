"use client";

import { useActionState } from "react";
import { FormSubmitButton } from "@/features/admin/components/form-submit-button";
import { sendInvoiceFormAction } from "@/features/invoices/actions";
import type { InvoiceActionResult } from "@/features/invoices/actions";

export function SendInvoiceButton({
  invoiceId,
  canText,
  canEmail,
  emailHint,
  alreadySent,
}: {
  invoiceId: string;
  canText: boolean;
  canEmail: boolean;
  emailHint?: string | null;
  alreadySent: boolean;
}) {
  const [state, formAction] = useActionState<InvoiceActionResult | null, FormData>(
    sendInvoiceFormAction.bind(null, invoiceId),
    null
  );

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <fieldset className="space-y-1">
        <legend className="text-xs font-medium text-stone-600">Send by</legend>
        <label className="flex items-center gap-2 text-sm text-stone-800">
          <input
            type="checkbox"
            name="channel_text"
            value="yes"
            defaultChecked={canText}
            disabled={!canText}
          />
          Text
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-800">
          <input
            type="checkbox"
            name="channel_email"
            value="yes"
            defaultChecked={canEmail}
            disabled={!canEmail}
          />
          Email
        </label>
      </fieldset>
      {emailHint ? <p className="max-w-xs text-xs text-stone-500">{emailHint}</p> : null}
      {alreadySent ? <input type="hidden" name="resend" value="yes" /> : null}
      <FormSubmitButton pendingLabel="Sending…">
        {alreadySent ? "Resend" : "Send invoice"}
      </FormSubmitButton>
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
