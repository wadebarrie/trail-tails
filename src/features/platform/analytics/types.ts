export type CompanyPlanTier = "trial" | "starter" | "growth" | "enterprise";
export type CompanyStatus = "active" | "paused" | "churned";

export type HealthStatus =
  | "healthy"
  | "low_usage"
  | "high_cost"
  | "at_risk"
  | "trial_inactive"
  | "needs_attention";

export type PlatformCostAssumptions = {
  id: string;
  sms_outbound_usd: number;
  sms_inbound_usd: number;
  eta_calculation_usd: number;
  geocode_usd: number;
  base_infra_per_company_usd: number;
  supabase_platform_usd: number;
  netlify_platform_usd: number;
  updated_at: string;
};

export type CompanyUsageRow = {
  id: string;
  name: string;
  planTier: CompanyPlanTier;
  status: CompanyStatus;
  trialEndsAt: string | null;
  monthlySubscriptionCents: number;
  activeDogs: number;
  activeDrivers: number;
  routesThisMonth: number;
  completedHikesThisMonth: number;
  smsSent: number;
  smsInbound: number;
  smsFailed: number;
  etaCalculations: number;
  failedNotifications: number;
  webhookErrors: number;
  estimatedCostUsd: number;
  estimatedRevenueUsd: number;
  estimatedMarginUsd: number;
  lastActiveAt: string | null;
  health: HealthStatus;
  alerts: string[];
};

export type PlatformOverviewMetrics = {
  totalCompanies: number;
  activeCompanies: number;
  trialCompanies: number;
  payingCompanies: number;
  activeDogs: number;
  activeDrivers: number;
  routesThisMonth: number;
  completedHikesThisMonth: number;
  smsSentThisMonth: number;
  etaCalculationsThisMonth: number;
  failedSmsThisMonth: number;
  estimatedInfraCostUsd: number;
  estimatedGrossMarginUsd: number;
  estimatedRevenueUsd: number;
};

export type TrendPoint = {
  date: string;
  value: number;
};

export type PlatformTrends = {
  smsSent: TrendPoint[];
  etaCalculations: TrendPoint[];
  completedHikes: TrendPoint[];
  activeCompanies: TrendPoint[];
  activeDogs: TrendPoint[];
  failureRate: TrendPoint[];
};

export type PlatformAlert = {
  companyId: string;
  companyName: string;
  severity: "warning" | "critical";
  message: string;
};

export type UsageEvent = {
  id: string;
  companyId: string | null;
  companyName: string | null;
  eventType: "sms" | "notification" | "system" | "webhook";
  level: "info" | "warn" | "error";
  summary: string;
  detail: string | null;
  createdAt: string;
};

export type CompanyDetailMetrics = CompanyUsageRow & {
  timezone: string;
  createdAt: string;
  totalRoutes: number;
  totalCustomers: number;
  recentEvents: UsageEvent[];
  recentErrors: UsageEvent[];
  lastActiveUsers: { name: string; role: string; lastSeen: string | null }[];
};
