import Link from "next/link";
import { PageHeader } from "@/features/admin/components/ui";
import { GenerateReviewForm } from "@/features/platform/components/analytics/generate-review-form";
import { listOperationalReviews } from "@/features/platform/analytics/operational-review-queries";
import { getPlatformOverview } from "@/features/platform/analytics/queries";

export const dynamic = "force-dynamic";

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function OwnerReviewsPage() {
  const [{ companies }, reviews] = await Promise.all([
    getPlatformOverview(),
    listOperationalReviews(),
  ]);

  return (
    <div>
      <PageHeader
        title="Operational reviews"
        description="Generate monthly value reports for each customer. Snapshots stay fixed even if source data changes later."
      />

      <section className="mb-8 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900">Generate review</h2>
        <p className="mt-1 text-sm text-stone-600">
          Pick a company and month to calculate metrics and draft a review.
        </p>
        <GenerateReviewForm companies={companies} defaultMonth={currentMonthValue()} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-stone-900">Saved reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-stone-500">No saved reviews yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
            {reviews.map((review) => (
              <li key={review.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium text-stone-900">{review.companyName}</p>
                  <p className="text-sm text-stone-500">
                    {review.reviewMonth} · {review.status}
                  </p>
                </div>
                <Link
                  href={`/owner/reviews/${review.companyId}/${review.reviewMonth}`}
                  className="text-sm font-medium text-[var(--color-trail-700)] hover:underline"
                >
                  Open →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
