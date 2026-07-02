"use client";

import { useActionState } from "react";
import { updateFounderProfileAction } from "@/features/platform/analytics/actions";
import { SubmitButton } from "@/features/admin/components/ui";
import { DatePickerField } from "@/features/admin/components/date-picker-field";
import type { CompanyDetailMetrics } from "@/features/platform/analytics/types";

export function FounderProfileForm({ company }: { company: CompanyDetailMetrics }) {
  const [state, formAction, pending] = useActionState(updateFounderProfileAction, {
    ok: false as const,
    error: "",
  });

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-stone-200 bg-white p-6"
    >
      <h2 className="text-lg font-semibold text-stone-900">Founder notes</h2>
      <input type="hidden" name="company_id" value={company.id} />

      {state.ok ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Founder profile updated.
        </p>
      ) : null}
      {!state.ok && "error" in state && state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor="case_study_status" className="block text-sm font-medium text-stone-700">
          Case study status
        </label>
        <select
          id="case_study_status"
          name="case_study_status"
          defaultValue={company.caseStudyStatus}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
        >
          <option value="none">None</option>
          <option value="candidate">Candidate</option>
          <option value="in_progress">In progress</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div>
        <label htmlFor="follow_up_date" className="block text-sm font-medium text-stone-700">
          Follow-up date
        </label>
        <DatePickerField
          id="follow_up_date"
          name="follow_up_date"
          defaultValue={company.followUpDate ?? ""}
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="internal_notes" className="block text-sm font-medium text-stone-700">
          Internal notes
        </label>
        <textarea
          id="internal_notes"
          name="internal_notes"
          rows={4}
          defaultValue={company.internalNotes ?? ""}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
          placeholder="Support context, feedback, follow-up items…"
        />
      </div>

      <div>
        <label htmlFor="customer_quote" className="block text-sm font-medium text-stone-700">
          Customer quote (optional)
        </label>
        <textarea
          id="customer_quote"
          name="customer_quote"
          rows={2}
          defaultValue={company.customerQuote ?? ""}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
          placeholder="For case studies or monthly reviews"
        />
      </div>

      <SubmitButton pending={pending}>Save founder notes</SubmitButton>
    </form>
  );
}
