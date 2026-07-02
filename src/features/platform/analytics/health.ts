import type {
  CompanyUsageRow,
  HealthStatus,
  PlatformAlert,
} from "@/features/platform/analytics/types";

const MS_PER_DAY = 86_400_000;

export function daysSince(isoDate: string | null, now = Date.now()): number | null {
  if (!isoDate) return null;
  return Math.floor((now - new Date(isoDate).getTime()) / MS_PER_DAY);
}

export function computeHealthStatus(
  row: Pick<
    CompanyUsageRow,
    | "plan"
    | "subscriptionStatus"
    | "trialEndsAt"
    | "activeDogs"
    | "activeDrivers"
    | "completedHikesThisMonth"
    | "smsSent"
    | "smsFailed"
    | "failedNotifications"
    | "webhookErrors"
    | "estimatedMarginUsd"
    | "estimatedCostUsd"
    | "estimatedRevenueUsd"
    | "lastActiveAt"
  >
): HealthStatus {
  const inactiveDays = daysSince(row.lastActiveAt);
  const trialDaysLeft = row.trialEndsAt
    ? Math.ceil((new Date(row.trialEndsAt).getTime() - Date.now()) / MS_PER_DAY)
    : null;

  if (
    row.subscriptionStatus === "cancelled" ||
    row.subscriptionStatus === "inactive"
  ) {
    return "at_risk";
  }
  if (
    row.subscriptionStatus === "trial" &&
    inactiveDays != null &&
    inactiveDays >= 7
  ) {
    return "trial_inactive";
  }
  if (inactiveDays != null && inactiveDays >= 7) return "at_risk";
  if (row.activeDogs === 0 || row.activeDrivers === 0) return "needs_attention";
  if (row.webhookErrors >= 3 || row.failedNotifications >= 10 || row.smsFailed >= 10) {
    return "needs_attention";
  }
  if (row.estimatedMarginUsd < 0 && row.estimatedRevenueUsd > 0) return "high_cost";
  if (
    row.estimatedRevenueUsd > 0 &&
    row.estimatedMarginUsd / row.estimatedRevenueUsd < 0.3
  ) {
    return "high_cost";
  }
  if (row.smsSent > 500 && row.estimatedCostUsd > row.estimatedRevenueUsd * 0.5) {
    return "high_cost";
  }
  if (
    row.activeDogs >= 3 &&
    row.completedHikesThisMonth < 5 &&
    inactiveDays != null &&
    inactiveDays <= 7
  ) {
    return "low_usage";
  }
  if (trialDaysLeft != null && trialDaysLeft <= 7 && trialDaysLeft >= 0) {
    return "needs_attention";
  }
  return "healthy";
}

export function buildCompanyAlerts(row: CompanyUsageRow): string[] {
  const alerts: string[] = [];
  const inactiveDays = daysSince(row.lastActiveAt);

  if (row.smsSent > 300) alerts.push("High SMS usage this month");
  if (row.smsFailed >= 5) alerts.push("High failed SMS count");
  if (row.etaCalculations > 200) alerts.push("High ETA calculation volume");
  if (inactiveDays != null && inactiveDays >= 7) {
    alerts.push(`No activity in ${inactiveDays} days`);
  }
  if (row.trialEndsAt) {
    const daysLeft = Math.ceil(
      (new Date(row.trialEndsAt).getTime() - Date.now()) / MS_PER_DAY
    );
    if (daysLeft <= 7 && daysLeft >= 0) {
      alerts.push(`Trial ending in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`);
    }
  }
  if (row.subscriptionStatus === "past_due") {
    alerts.push("Subscription past due");
  }
  if (row.activeDogs >= 2 && row.completedHikesThisMonth < 3) {
    alerts.push("Low route completion rate");
  }
  if (row.estimatedMarginUsd < 0 && row.estimatedRevenueUsd > 0) {
    alerts.push("Negative estimated margin");
  } else if (
    row.estimatedRevenueUsd > 0 &&
    row.estimatedMarginUsd / row.estimatedRevenueUsd < 0.2
  ) {
    alerts.push("Low estimated margin");
  }
  if (row.activeDogs === 0) alerts.push("No active dogs");
  if (row.activeDrivers === 0) alerts.push("No active drivers");
  if (row.webhookErrors >= 2) alerts.push("Repeated webhook errors");

  return alerts;
}

export function collectPlatformAlerts(rows: CompanyUsageRow[]): PlatformAlert[] {
  const alerts: PlatformAlert[] = [];

  for (const row of rows) {
    for (const message of row.alerts) {
      alerts.push({
        companyId: row.id,
        companyName: row.name,
        severity:
          message.includes("Negative") ||
          message.includes("No activity") ||
          message.includes("webhook") ||
          message.includes("past due")
            ? "critical"
            : "warning",
        message,
      });
    }
  }

  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === "critical" ? -1 : 1;
    }
    return a.companyName.localeCompare(b.companyName);
  });
}

export function healthStatusLabel(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return "Healthy";
    case "low_usage":
      return "Low usage";
    case "high_cost":
      return "High cost";
    case "at_risk":
      return "At risk";
    case "trial_inactive":
      return "Trial inactive";
    case "needs_attention":
      return "Needs attention";
  }
}

export function healthStatusClass(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return "bg-emerald-100 text-emerald-800";
    case "low_usage":
      return "bg-amber-100 text-amber-800";
    case "high_cost":
      return "bg-orange-100 text-orange-800";
    case "at_risk":
    case "trial_inactive":
      return "bg-red-100 text-red-800";
    case "needs_attention":
      return "bg-yellow-100 text-yellow-900";
  }
}

export {
  subscriptionPlanLabel as planTierLabel,
  subscriptionStatusLabel as companyStatusLabel,
} from "@/features/subscription/helpers";
