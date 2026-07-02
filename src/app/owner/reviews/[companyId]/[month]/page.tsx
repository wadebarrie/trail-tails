import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/components/ui";
import { OperationalReviewEditor } from "@/features/platform/components/analytics/operational-review-editor";
import {
  generateOperationalReviewDraft,
  getOperationalReview,
} from "@/features/platform/analytics/operational-review-queries";
import { getCompanyDetail } from "@/features/platform/analytics/queries";

export const dynamic = "force-dynamic";

export default async function OperationalReviewPage({
  params,
}: {
  params: Promise<{ companyId: string; month: string }>;
}) {
  const { companyId, month } = await params;

  if (!/^\d{4}-\d{2}$/.test(month)) notFound();

  let review = await getOperationalReview(companyId, month);

  if (!review) {
    const company = await getCompanyDetail(companyId);
    if (!company) notFound();
    review = await generateOperationalReviewDraft(companyId, company.name, month, company);
  }

  return (
    <div>
      <PageHeader
        title="Monthly review"
        description={`${review.companyName} · ${month}`}
        action={
          <Link
            href="/owner/reviews"
            className="text-sm text-stone-600 hover:text-[var(--color-trail-700)] hover:underline"
          >
            ← All reviews
          </Link>
        }
      />
      <OperationalReviewEditor review={review} />
    </div>
  );
}
