import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformOwner } from "@/features/platform/queries";
import { getCostAssumptions } from "@/features/platform/analytics/queries";
import { fetchMonthlyCompanyMetrics } from "@/features/platform/analytics/monthly-metrics";
import {
  buildDefaultReviewSummary,
  buildDefaultValueDelivered,
  estimateMinutesSaved,
  suggestCaseStudyReadiness,
  type OperationalReviewMetrics,
  type OperationalReviewRecord,
} from "@/features/platform/analytics/operational-review";
import { computeHealthStatus } from "@/features/platform/analytics/health";
import type { CompanyUsageRow } from "@/features/platform/analytics/types";

function mapReviewRow(
  row: Record<string, unknown>,
  companyName: string
): OperationalReviewRecord {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    companyName,
    reviewMonth: (row.review_month as string).slice(0, 7),
    metrics: row.metrics as OperationalReviewMetrics,
    summary: (row.summary as string | null) ?? null,
    valueDelivered: (row.value_delivered as string | null) ?? null,
    operationalHighlights: (row.operational_highlights as string | null) ?? null,
    issues: (row.issues as string | null) ?? null,
    featureRequests: (row.feature_requests as string | null) ?? null,
    caseStudyReadiness: (row.case_study_readiness as string | null) ?? null,
    customerQuote: (row.customer_quote as string | null) ?? null,
    internalNotes: (row.internal_notes as string | null) ?? null,
    status: row.status as OperationalReviewRecord["status"],
    reviewedAt: (row.reviewed_at as string | null) ?? null,
    sentAt: (row.sent_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function generateOperationalReviewDraft(
  companyId: string,
  companyName: string,
  reviewMonth: string,
  usageRow?: Pick<
    CompanyUsageRow,
    "health" | "subscriptionStatus" | "completedHikesThisMonth" | "smsSent" | "failedNotifications" | "activeDogs" | "lastActiveAt"
  >
): Promise<OperationalReviewRecord> {
  await requirePlatformOwner();
  const [assumptions, metrics] = await Promise.all([
    getCostAssumptions(),
    fetchMonthlyCompanyMetrics(companyId, reviewMonth),
  ]);

  const minutesSaved = estimateMinutesSaved(metrics, assumptions);
  const reviewMetrics: OperationalReviewMetrics = {
    ...metrics,
    estimatedMinutesSaved: minutesSaved,
    estimatedHoursSaved: minutesSaved / 60,
  };

  const health = usageRow?.health ?? "healthy";
  const issues =
    reviewMetrics.failedNotifications > 0
      ? `${reviewMetrics.failedNotifications} failed customer notifications this month.`
      : null;

  const reviewMonthLabel = new Date(`${reviewMonth}-01T12:00:00Z`).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric", timeZone: "UTC" }
  );

  return {
    id: "",
    companyId,
    companyName,
    reviewMonth,
    metrics: reviewMetrics,
    summary: buildDefaultReviewSummary(companyName, reviewMonthLabel, reviewMetrics),
    valueDelivered: buildDefaultValueDelivered(reviewMetrics),
    operationalHighlights: null,
    issues,
    featureRequests: null,
    caseStudyReadiness: suggestCaseStudyReadiness(reviewMetrics, health),
    customerQuote: null,
    internalNotes: null,
    status: "draft",
    reviewedAt: null,
    sentAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getOperationalReview(
  companyId: string,
  reviewMonth: string
): Promise<OperationalReviewRecord | null> {
  await requirePlatformOwner();
  const supabase = createServiceClient();

  const [{ data: review, error }, { data: company }] = await Promise.all([
    supabase
      .from("operational_reviews")
      .select("*")
      .eq("company_id", companyId)
      .eq("review_month", `${reviewMonth}-01`)
      .maybeSingle(),
    supabase.from("companies").select("name").eq("id", companyId).maybeSingle(),
  ]);

  if (error) throw new Error(error.message);
  if (!review || !company) return null;

  return mapReviewRow(review, company.name);
}

export async function listOperationalReviews(
  companyId?: string
): Promise<OperationalReviewRecord[]> {
  await requirePlatformOwner();
  const supabase = createServiceClient();

  let query = supabase
    .from("operational_reviews")
    .select("*, companies(name)")
    .order("review_month", { ascending: false })
    .limit(50);

  if (companyId) query = query.eq("company_id", companyId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const companies = row.companies as { name: string } | { name: string }[] | null;
    const companyName = Array.isArray(companies)
      ? companies[0]?.name ?? "Unknown"
      : companies?.name ?? "Unknown";
    const { companies: _, ...rest } = row;
    return mapReviewRow(rest as Record<string, unknown>, companyName);
  });
}

export async function upsertOperationalReview(
  input: OperationalReviewRecord
): Promise<OperationalReviewRecord> {
  await requirePlatformOwner();
  const supabase = createServiceClient();

  const payload = {
    company_id: input.companyId,
    review_month: `${input.reviewMonth}-01`,
    metrics: input.metrics,
    summary: input.summary,
    value_delivered: input.valueDelivered,
    operational_highlights: input.operationalHighlights,
    issues: input.issues,
    feature_requests: input.featureRequests,
    case_study_readiness: input.caseStudyReadiness,
    customer_quote: input.customerQuote,
    internal_notes: input.internalNotes,
    status: input.status,
    reviewed_at: input.reviewedAt,
    sent_at: input.sentAt,
  };

  const { data, error } = await supabase
    .from("operational_reviews")
    .upsert(payload, { onConflict: "company_id,review_month" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", input.companyId)
    .single();

  return mapReviewRow(data, company?.name ?? input.companyName);
}

/** Recompute health for review generation when usage row not passed. */
export function healthForReview(metrics: OperationalReviewMetrics): string {
  return computeHealthStatus({
    plan: "starter",
    subscriptionStatus: "active",
    trialEndsAt: null,
    activeDogs: metrics.activeDogs,
    activeDrivers: metrics.activeDrivers,
    completedHikesThisMonth: metrics.hikesCompleted,
    smsSent: metrics.notificationsSent,
    smsFailed: 0,
    failedNotifications: metrics.failedNotifications,
    webhookErrors: 0,
    estimatedMarginUsd: 0,
    estimatedCostUsd: 0,
    estimatedRevenueUsd: 0,
    lastActiveAt: new Date().toISOString(),
  });
}
