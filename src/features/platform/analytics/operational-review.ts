import type { PlatformCostAssumptions } from "@/features/platform/analytics/types";

/** Raw counts for a company in a calendar month (UTC). */
export type MonthlyCompanyMetrics = {
  activeDogs: number;
  activeDrivers: number;
  activeAdmins: number;
  routesCreated: number;
  hikesCompleted: number;
  pickupActions: number;
  dropoffActions: number;
  driverActions: number;
  notificationsSent: number;
  etaNotifications: number;
  nightBeforeReminders: number;
  pickupConfirmations: number;
  dropoffConfirmations: number;
  failedNotifications: number;
  inboundSmsRequests: number;
  pendingRequestsTotal: number;
  pendingRequestsApproved: number;
  pendingRequestsDeclined: number;
  skipRequests: number;
  pauseResumeRequests: number;
  billableHikes: number;
  billingPeriodHikes: number;
};

export type OperationalReviewMetrics = MonthlyCompanyMetrics & {
  estimatedMinutesSaved: number;
  estimatedHoursSaved: number;
};

export type OperationalReviewRecord = {
  id: string;
  companyId: string;
  companyName: string;
  reviewMonth: string;
  metrics: OperationalReviewMetrics;
  summary: string | null;
  valueDelivered: string | null;
  operationalHighlights: string | null;
  issues: string | null;
  featureRequests: string | null;
  caseStudyReadiness: string | null;
  customerQuote: string | null;
  internalNotes: string | null;
  status: "draft" | "reviewed" | "sent";
  reviewedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TimeSavedAssumptions = Pick<
  PlatformCostAssumptions,
  | "minutes_per_eta_notification"
  | "minutes_per_sms_request"
  | "minutes_per_route_created"
  | "minutes_per_billing_export"
>;

export function monthRangeUtc(reviewMonth: string): { start: string; end: string } {
  const [year, month] = reviewMonth.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function estimateMinutesSaved(
  metrics: MonthlyCompanyMetrics,
  assumptions: TimeSavedAssumptions
): number {
  return (
    metrics.etaNotifications * assumptions.minutes_per_eta_notification +
    metrics.inboundSmsRequests * assumptions.minutes_per_sms_request +
    metrics.routesCreated * assumptions.minutes_per_route_created
  );
}

export function buildDefaultReviewSummary(
  companyName: string,
  reviewMonth: string,
  metrics: OperationalReviewMetrics
): string {
  return [
    `Here is what PackRoute helped ${companyName} handle in ${reviewMonth}.`,
    `${metrics.hikesCompleted} hikes completed, ${metrics.notificationsSent} customer notifications sent, and ${metrics.inboundSmsRequests} inbound customer SMS requests captured.`,
    `Estimated time saved is directional (~${metrics.estimatedHoursSaved.toFixed(1)} hours) based on configurable assumptions.`,
  ].join(" ");
}

export function buildDefaultValueDelivered(metrics: OperationalReviewMetrics): string {
  const lines = [
    `Driver workflow: ${metrics.driverActions} stop status updates (${metrics.pickupActions} pickups, ${metrics.dropoffActions} drop-offs).`,
    `Customer communication: ${metrics.notificationsSent} notifications including ${metrics.etaNotifications} ETA/en-route updates and ${metrics.nightBeforeReminders} night-before reminders.`,
    `Office coordination: ${metrics.pendingRequestsApproved} schedule requests approved of ${metrics.pendingRequestsTotal} received.`,
  ];
  if (metrics.billableHikes > 0) {
    lines.push(`Billing prep: ${metrics.billableHikes} billable hikes tracked for the period.`);
  }
  return lines.join("\n");
}

export function suggestCaseStudyReadiness(
  metrics: OperationalReviewMetrics,
  health: string
): string {
  if (health === "case_study_candidate") {
    return "Strong usage this month — good candidate for a case study conversation.";
  }
  if (metrics.hikesCompleted >= 5 && metrics.failedNotifications <= 3) {
    return "Moderate usage with reliable notifications — may be worth exploring after another active month.";
  }
  if (metrics.failedNotifications > 5 || metrics.hikesCompleted < 3) {
    return "Workflow or reliability gaps this month — focus on support before case study outreach.";
  }
  return "Insufficient activity this month for case study readiness.";
}
