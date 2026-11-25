"use client";

import { useActionState, useEffect, useState } from "react";
import { FormSubmitButton } from "@/features/admin/components/form-submit-button";
import { createInvoicePayLinkFormAction } from "@/features/invoices/actions";
import type { InvoiceActionResult } from "@/features/invoices/actions";

export function CreatePayLinkButton({
  invoiceId,
  existingUrl,
}: {
  invoiceId: string;
  existingUrl?: string | null;
}) {
  const [state, formAction] = useActionState<InvoiceActionResult | null>(
    createInvoicePayLinkFormAction.bind(null, invoiceId),
    null
  );
  const [copied, setCopied] = useState(false);
  const url = state?.ok ? state.url : existingUrl;

  useEffect(() => {
    setCopied(false);
  }, [url]);

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="max-w-xl space-y-3 rounded-xl border border-stone-200 bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold text-stone-900">Online card pay</h3>
        <p className="mt-1 text-sm text-stone-600">
          Create a CAD Stripe Checkout link for the remaining balance. When the
          owner pays, this invoice marks paid automatically.
        </p>
      </div>

      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <FormSubmitButton pendingLabel="Creating…">
          {url ? "Create new link" : "Create pay link"}
        </FormSubmitButton>
        {url ? (
          <>
            <button
              type="button"
              onClick={copyLink}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Open checkout
            </a>
          </>
        ) : null}
      </form>

      {state?.ok === false ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state?.ok && state.message ? (
        <p className="text-sm text-emerald-700">{state.message}</p>
      ) : null}
      {url ? (
        <p className="break-all text-xs text-stone-500">{url}</p>
      ) : null}
    </div>
  );
}
