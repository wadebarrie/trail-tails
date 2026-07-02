import type {
  BillingCurrency,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/features/subscription/types";

export type CaseStudyStatus = "none" | "candidate" | "in_progress" | "published";

export type HealthStatus =
  | "healthy"
  | "low_usage"
  | "high_cost"
  | "at_risk"
  | "trial_inactive"
  | "needs_attention"
  | "case_study_candidate";

export type PlatformCostAssumptions = {
  id: string;
  sms_outbound_usd: number;
  sms_inbound_usd: number;
  eta_calculation_usd: number;
  geocode_usd: number;
  base_infra_per_company_usd: number;
  supabase_platform_usd: number;
  netlify_platform_usd: number;
  minutes_per_eta_notification: number;
  minutes_per_sms_request: number;
  minutes_per_route_created: number;
  minutes_per_billing_export: number;
  updated_at: string;
};

export type CompanyUsageRow = {
  id: string;
  name: string;
  plan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  monthlyPrice: number;
  billingCurrency: BillingCurrency;
  billingInterval: "monthly" | "yearly";
  grandfathered: boolean;
  currentPeriodEnd: string | null;
  activeDogs: number;
  activeDrivers: number;
  activeAdmins: number;
  routesThisMonth: number;
  completedHikesThisMonth: number;
  driverActionsThisMonth: number;
  pendingRequestsThisMonth: number;
  notificationsSent: number;
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
  caseStudyStatus: CaseStudyStatus;
  followUpDate: string | null;
};

export type PlatformOverviewMetrics = {
  totalCompanies: number;
  activeCompanies: number;
  trialCompanies: number;
  payingCompanies: number;
  betaPartners: number;
  grandfatheredCompanies: number;
  atRiskCompanies: number;
  caseStudyCandidates: number;
  activeDogs: number;
  activeDrivers: number;
  activeAdmins: number;
  routesThisMonth: number;
  completedHikesThisMonth: number;
  driverActionsThisMonth: number;
  pendingRequestsThisMonth: number;
  notificationsSentThisMonth: number;
  smsSentThisMonth: number;
  etaCalculationsThisMonth: number;
  failedNotificationsThisMonth: number;
  failedSmsThisMonth: number;
  estimatedInfraCostUsd: number;
  estimatedGrossMarginUsd: number;
  estimatedRevenueUsd: number;
  estimatedMrrUsd: number;
  payingMrrUsd: number;
  trialMrrPotentialUsd: number;
  betaPartnerMrrUsd: number;
  grandfatheredMrrUsd: number;
  pastDueSubscriptions: number;
  cancelledSubscriptions: number;
  activeSubscriptions: number;
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
  internalNotes: string | null;
  customerQuote: string | null;
  recentEvents: UsageEvent[];
  recentErrors: UsageEvent[];
  lastActiveUsers: { name: string; role: string; lastSeen: string | null }[];
};
