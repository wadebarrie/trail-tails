"use client";

import { useActionState } from "react";
import { secondaryButtonClassName } from "@/features/admin/components/button-styles";
import { markOverdueFormAction } from "@/features/invoices/actions";
import type { InvoiceActionResult } from "@/features/invoices/actions";

export function MarkOverdueButton() {
  const [state, formAction, pending] = useActionState<
    InvoiceActionResult | null
  >(markOverdueFormAction, null);

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className={secondaryButtonClassName}
      >
        {pending ? "Checking…" : "Mark past-due as overdue"}
      </button>
      {state?.ok === false ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state?.ok && state.message ? (
        <p role="status" className="text-sm text-stone-600">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
