"use client";

import { useActionState } from "react";
import {
  inputClassName,
  selectClassName,
} from "@/features/admin/components/form-styles";
import { FormSubmitButton } from "@/features/admin/components/form-submit-button";
import { recordManualPaymentFormAction } from "@/features/invoices/actions";
import type { InvoiceActionResult } from "@/features/invoices/actions";

export function RecordPaymentForm({
  invoiceId,
  balanceCents,
  today,
}: {
  invoiceId: string;
  balanceCents: number;
  /** YYYY-MM-DD in the company timezone */
  today: string;
}) {
  const [state, formAction] = useActionState<
    InvoiceActionResult | null,
    FormData
  >(recordManualPaymentFormAction.bind(null, invoiceId), null);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state?.ok === false ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="payment-amount" className="block text-sm font-medium text-stone-700">
            Amount (CAD)
          </label>
          <input
            id="payment-amount"
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            required
            defaultValue={(balanceCents / 100).toFixed(2)}
            className={`mt-1 ${inputClassName}`}
          />
        </div>
        <div>
          <label htmlFor="payment-method" className="block text-sm font-medium text-stone-700">
            Method
          </label>
          <select
            id="payment-method"
            name="method"
            defaultValue="e_transfer"
            className={`mt-1 ${selectClassName}`}
          >
            <option value="e_transfer">Interac e-Transfer</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="payment-date" className="block text-sm font-medium text-stone-700">
            Date received
          </label>
          <input
            id="payment-date"
            name="paid_at"
            type="date"
            defaultValue={today}
            className={`mt-1 ${inputClassName}`}
          />
        </div>
        <div>
          <label htmlFor="payment-reference" className="block text-sm font-medium text-stone-700">
            Reference
          </label>
          <input
            id="payment-reference"
            name="reference"
            type="text"
            placeholder="Optional"
            className={`mt-1 ${inputClassName}`}
          />
        </div>
      </div>

      <FormSubmitButton pendingLabel="Recording payment…">
        Record payment
      </FormSubmitButton>
      <p className="text-xs text-stone-500">
        Saving to the server can take a few seconds on a slow connection.
      </p>
    </form>
  );
}
