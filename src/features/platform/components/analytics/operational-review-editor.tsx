"use client";

import { useActionState, useMemo, useState } from "react";
import { saveOperationalReviewAction } from "@/features/platform/analytics/actions";
import { SubmitButton } from "@/features/admin/components/ui";
import type { OperationalReviewRecord } from "@/features/platform/analytics/operational-review";

function buildCopyText(review: OperationalReviewRecord): string {
  const m = review.metrics;
  return [
    `PackRoute monthly review — ${review.companyName} (${review.reviewMonth})`,
    "",
    review.summary ?? "",
    "",
    "Key metrics:",
    `- ${m.hikesCompleted} hikes completed`,
    `- ${m.notificationsSent} customer notifications`,
    `- ${m.inboundSmsRequests} inbound SMS requests`,
    `- ~${m.estimatedHoursSaved.toFixed(1)} hours estimated time saved (directional)`,
    "",
    review.valueDelivered ?? "",
    "",
    review.issues ? `Issues: ${review.issues}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function OperationalReviewEditor({
  review: initialReview,
}: {
  review: OperationalReviewRecord;
}) {
  const [review, setReview] = useState(initialReview);
  const [copied, setCopied] = useState(false);
  const metricsJson = useMemo(() => JSON.stringify(review.metrics), [review.metrics]);

  const [state, formAction, pending] = useActionState(saveOperationalReviewAction, {
    ok: false as const,
    error: "",
  });

  async function copySummary() {
    await navigator.clipboard.writeText(buildCopyText(review));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function printReview() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          onClick={copySummary}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          {copied ? "Copied!" : "Copy summary"}
        </button>
        <button
          type="button"
          onClick={printReview}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Print / PDF
        </button>
      </div>

      <article id="operational-review" className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8">
        <header className="border-b border-stone-100 pb-4">
          <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
            Monthly operational review
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-stone-900">{review.companyName}</h1>
          <p className="mt-1 text-stone-600">{review.reviewMonth}</p>
        </header>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Summary</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-700">{review.summary}</p>
          <p className="mt-3 text-xs text-stone-500">
            Estimated time saved is based on configurable assumptions and should be treated as
            directional.
          </p>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Dogs managed", review.metrics.activeDogs],
            ["Active drivers", review.metrics.activeDrivers],
            ["Routes created", review.metrics.routesCreated],
            ["Hikes completed", review.metrics.hikesCompleted],
            ["Driver actions", review.metrics.driverActions],
            ["Notifications sent", review.metrics.notificationsSent],
            ["ETA notifications", review.metrics.etaNotifications],
            ["Inbound SMS requests", review.metrics.inboundSmsRequests],
            ["Pending requests", review.metrics.pendingRequestsTotal],
            ["Billable hikes", review.metrics.billableHikes],
            [
              "Est. time saved",
              `~${review.metrics.estimatedHoursSaved.toFixed(1)} hrs`,
            ],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-stone-50 px-3 py-2">
              <p className="text-xs text-stone-500">{label}</p>
              <p className="text-lg font-semibold text-stone-900">{value}</p>
            </div>
          ))}
        </section>

        {review.valueDelivered ? (
          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Value delivered
            </h2>
            <pre className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
              {review.valueDelivered}
            </pre>
          </section>
        ) : null}

        {review.issues ? (
          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Issues / failures
            </h2>
            <p className="mt-2 text-sm text-stone-700">{review.issues}</p>
          </section>
        ) : null}

        {review.caseStudyReadiness ? (
          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Case study readiness
            </h2>
            <p className="mt-2 text-sm text-stone-700">{review.caseStudyReadiness}</p>
          </section>
        ) : null}
      </article>

      <form action={formAction} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 print:hidden">
        <h2 className="text-lg font-semibold text-stone-900">Edit &amp; save snapshot</h2>
        <input type="hidden" name="company_id" value={review.companyId} />
        <input type="hidden" name="review_month" value={review.reviewMonth} />
        <input type="hidden" name="company_name" value={review.companyName} />
        <input type="hidden" name="metrics_json" value={metricsJson} />

        {state.ok ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Review saved.
          </p>
        ) : null}
        {!state.ok && "error" in state && state.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        ) : null}

        <Field label="Summary" name="summary" defaultValue={review.summary ?? ""} rows={3} />
        <Field
          label="Value delivered"
          name="value_delivered"
          defaultValue={review.valueDelivered ?? ""}
          rows={4}
        />
        <Field
          label="Operational highlights"
          name="operational_highlights"
          defaultValue={review.operationalHighlights ?? ""}
          rows={3}
        />
        <Field label="Issues" name="issues" defaultValue={review.issues ?? ""} rows={2} />
        <Field
          label="Feature requests / notes"
          name="feature_requests"
          defaultValue={review.featureRequests ?? ""}
          rows={2}
        />
        <Field
          label="Case study readiness"
          name="case_study_readiness"
          defaultValue={review.caseStudyReadiness ?? ""}
          rows={2}
        />
        <Field
          label="Customer quote"
          name="customer_quote"
          defaultValue={review.customerQuote ?? ""}
          rows={2}
        />
        <Field
          label="Internal notes"
          name="internal_notes"
          defaultValue={review.internalNotes ?? ""}
          rows={2}
        />

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-stone-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={review.status}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="reviewed">Reviewed</option>
            <option value="sent">Sent</option>
          </select>
        </div>

        <SubmitButton pending={pending}>Save review snapshot</SubmitButton>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  rows,
}: {
  label: string;
  name: string;
  defaultValue: string;
  rows: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
      />
    </div>
  );
}
