import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformOwner } from "@/features/platform/queries";
import {
  DEFAULT_COST_ASSUMPTIONS,
  estimateCompanyCostUsd,
  estimateRevenueUsd,
} from "@/features/platform/analytics/cost";
import { listFounderProfiles } from "@/features/platform/analytics/founder-profiles";
import { listSubscriptionSummariesByCompanyIds } from "@/features/subscription/queries";
import type { SubscriptionSummary } from "@/features/subscription/types";
import {
  buildCompanyAlerts,
  collectPlatformAlerts,
  computeHealthStatus,
} from "@/features/platform/analytics/health";
import type {
  CompanyDetailMetrics,
  CompanyUsageRow,
  PlatformCostAssumptions,
  PlatformOverviewMetrics,
  PlatformTrends,
  TrendPoint,
  UsageEvent,
} from "@/features/platform/analytics/types";
import type {
  BillingCurrency,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/features/subscription/types";

const ASSUMPTIONS_ID = "b0000000-0000-0000-0000-000000000001";

function monthStartIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function groupCountByDate(
  rows: { created_at: string }[],
  startDate: string,
  days: number
): TrendPoint[] {
  const counts = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + i);
    counts.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of rows) {
    const key = toDateKey(row.created_at);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([date, value]) => ({ date, value }));
}

function groupCountByMonth(
  rows: { created_at: string }[],
  months: number
): TrendPoint[] {
  const now = new Date();
  const counts = new Map<string, number>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    counts.set(d.toISOString().slice(0, 7), 0);
  }
  for (const row of rows) {
    const key = row.created_at.slice(0, 7);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([date, value]) => ({ date, value }));
}

type CompanyRow = {
  id: string;
  name: string;
  timezone: string;
  created_at: string;
};

const EMPTY_SUBSCRIPTION: SubscriptionSummary = {
  plan: "starter",
  status: "inactive",
  trial_starts_at: null,
  trial_ends_at: null,
  monthly_price: 0,
  billing_currency: "USD",
  billing_interval: "monthly",
  grandfathered: false,
  current_period_start: null,
  current_period_end: null,
  cancelled_at: null,
};

export async function getCostAssumptions(): Promise<PlatformCostAssumptions> {
  await requirePlatformOwner();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("platform_cost_assumptions")
    .select("*")
    .eq("id", ASSUMPTIONS_ID)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    return {
      id: ASSUMPTIONS_ID,
      ...DEFAULT_COST_ASSUMPTIONS,
      updated_at: new Date().toISOString(),
    };
  }

  return {
    id: data.id,
    sms_outbound_usd: Number(data.sms_outbound_usd),
    sms_inbound_usd: Number(data.sms_inbound_usd),
    eta_calculation_usd: Number(data.eta_calculation_usd),
    geocode_usd: Number(data.geocode_usd),
    base_infra_per_company_usd: Number(data.base_infra_per_company_usd),
    supabase_platform_usd: Number(data.supabase_platform_usd),
    netlify_platform_usd: Number(data.netlify_platform_usd),
    minutes_per_eta_notification: Number(data.minutes_per_eta_notification ?? 1),
    minutes_per_sms_request: Number(data.minutes_per_sms_request ?? 3),
    minutes_per_route_created: Number(data.minutes_per_route_created ?? 5),
    minutes_per_billing_export: Number(data.minutes_per_billing_export ?? 30),
    updated_at: data.updated_at,
  };
}

async function fetchCompanyUsageRows(
  assumptions: PlatformCostAssumptions,
  filterCompanyId?: string
): Promise<CompanyUsageRow[]> {
  const supabase = createServiceClient();
  const monthStart = monthStartIso();
  const thirtyDaysAgo = daysAgoIso(30);

  let companyQuery = supabase
    .from("companies")
    .select("id, name, timezone, created_at")
    .order("name");

  if (filterCompanyId) {
    companyQuery = companyQuery.eq("id", filterCompanyId);
  }

  const { data: companies, error: companiesError } = await companyQuery;

  if (companiesError) throw new Error(companiesError.message);
  const companyList = (companies ?? []) as CompanyRow[];
  if (companyList.length === 0) return [];

  const companyIds = companyList.map((c) => c.id);
  const [subscriptionsByCompany, founderProfiles] = await Promise.all([
    listSubscriptionSummariesByCompanyIds(companyIds),
    listFounderProfiles(),
  ]);

  const [
    dogsRes,
    driversRes,
    adminsRes,
    routesRes,
    smsMonthRes,
    notifMonthRes,
    systemMonthRes,
    hikesRes,
    pendingMonthRes,
    driverStopsRes,
    smsRecentRes,
    notifRecentRes,
    hikeActivityRes,
  ] = await Promise.all([
    supabase.from("dogs").select("company_id").eq("is_active", true),
    supabase
      .from("profiles")
      .select("company_id")
      .eq("role", "driver")
      .eq("is_active", true),
    supabase
      .from("profiles")
      .select("company_id")
      .eq("role", "admin")
      .eq("is_active", true),
    supabase
      .from("routes")
      .select("company_id, created_at")
      .gte("created_at", monthStart),
    supabase
      .from("sms_messages")
      .select("company_id, direction, status, created_at")
      .gte("created_at", monthStart)
      .in("company_id", companyIds),
    supabase
      .from("notification_log")
      .select("company_id, notification_type, status, created_at")
      .gte("created_at", monthStart)
      .in("company_id", companyIds),
    supabase
      .from("system_logs")
      .select("company_id, category, level, created_at")
      .gte("created_at", monthStart)
      .in("company_id", companyIds),
    supabase
      .from("hikes")
      .select("id, company_id, date")
      .gte("date", monthStart.slice(0, 10))
      .in("company_id", companyIds),
    supabase
      .from("pending_requests")
      .select("company_id")
      .gte("created_at", monthStart)
      .in("company_id", companyIds),
    supabase
      .from("stops")
      .select("status, updated_at, hikes!inner(company_id)")
      .gte("updated_at", monthStart)
      .in("status", ["en_route", "arrived", "picked_up", "dropped_off"]),
    supabase
      .from("sms_messages")
      .select("company_id, created_at")
      .gte("created_at", thirtyDaysAgo)
      .in("company_id", companyIds),
    supabase
      .from("notification_log")
      .select("company_id, created_at")
      .gte("created_at", thirtyDaysAgo)
      .in("company_id", companyIds),
    supabase
      .from("stops")
      .select("updated_at, hikes!inner(company_id)")
      .gte("updated_at", thirtyDaysAgo),
  ]);

  const hikeIds = (hikesRes.data ?? []).map((h) => h.id);
  let completedByCompany = new Map<string, number>();

  if (hikeIds.length > 0) {
    const { data: completedStops } = await supabase
      .from("stops")
      .select("hike_id, status")
      .in("hike_id", hikeIds)
      .in("status", ["picked_up", "dropped_off"]);

    const hikeCompanyMap = new Map(
      (hikesRes.data ?? []).map((h) => [h.id, h.company_id as string])
    );
    const completedHikeIds = new Set<string>();
    for (const stop of completedStops ?? []) {
      if (stop.status === "picked_up" || stop.status === "dropped_off") {
        completedHikeIds.add(stop.hike_id);
      }
    }
    for (const hikeId of completedHikeIds) {
      const companyId = hikeCompanyMap.get(hikeId);
      if (companyId) {
        completedByCompany.set(companyId, (completedByCompany.get(companyId) ?? 0) + 1);
      }
    }
  }

  const countByCompany = (rows: { company_id: string }[] | null) => {
    const map = new Map<string, number>();
    for (const row of rows ?? []) {
      map.set(row.company_id, (map.get(row.company_id) ?? 0) + 1);
    }
    return map;
  };

  const activeDogs = countByCompany(dogsRes.data);
  const activeDrivers = countByCompany(driversRes.data);
  const activeAdmins = countByCompany(adminsRes.data);
  const routesThisMonth = countByCompany(routesRes.data);
  const pendingThisMonth = countByCompany(pendingMonthRes.data);

  const driverActionsThisMonth = new Map<string, number>();
  for (const stop of driverStopsRes.data ?? []) {
    const hikes = stop.hikes as { company_id: string } | { company_id: string }[];
    const companyId = Array.isArray(hikes) ? hikes[0]?.company_id : hikes?.company_id;
    if (companyId) {
      driverActionsThisMonth.set(
        companyId,
        (driverActionsThisMonth.get(companyId) ?? 0) + 1
      );
    }
  }

  const smsStats = new Map<
    string,
    { outbound: number; inbound: number; failed: number }
  >();
  for (const sms of smsMonthRes.data ?? []) {
    const stats = smsStats.get(sms.company_id) ?? {
      outbound: 0,
      inbound: 0,
      failed: 0,
    };
    if (sms.direction === "outbound") stats.outbound += 1;
    if (sms.direction === "inbound") stats.inbound += 1;
    if (sms.status === "failed") stats.failed += 1;
    smsStats.set(sms.company_id, stats);
  }

  const etaByCompany = new Map<string, number>();
  const notificationsSentByCompany = new Map<string, number>();
  const failedNotifByCompany = new Map<string, number>();
  for (const n of notifMonthRes.data ?? []) {
    if (n.notification_type === "en_route") {
      etaByCompany.set(n.company_id, (etaByCompany.get(n.company_id) ?? 0) + 1);
    }
    if (n.status !== "failed") {
      notificationsSentByCompany.set(
        n.company_id,
        (notificationsSentByCompany.get(n.company_id) ?? 0) + 1
      );
    }
    if (n.status === "failed") {
      failedNotifByCompany.set(
        n.company_id,
        (failedNotifByCompany.get(n.company_id) ?? 0) + 1
      );
    }
  }

  const webhookErrorsByCompany = new Map<string, number>();
  for (const log of systemMonthRes.data ?? []) {
    if (
      log.company_id &&
      log.category === "webhook" &&
      (log.level === "warn" || log.level === "error")
    ) {
      webhookErrorsByCompany.set(
        log.company_id,
        (webhookErrorsByCompany.get(log.company_id) ?? 0) + 1
      );
    }
  }

  const lastActiveByCompany = new Map<string, string>();
  const bumpLastActive = (companyId: string, iso: string) => {
    const prev = lastActiveByCompany.get(companyId);
    if (!prev || iso > prev) lastActiveByCompany.set(companyId, iso);
  };

  for (const row of smsRecentRes.data ?? []) {
    bumpLastActive(row.company_id, row.created_at);
  }
  for (const row of notifRecentRes.data ?? []) {
    bumpLastActive(row.company_id, row.created_at);
  }
  for (const row of hikeActivityRes.data ?? []) {
    const hikes = row.hikes as { company_id: string } | { company_id: string }[];
    const companyId = Array.isArray(hikes) ? hikes[0]?.company_id : hikes?.company_id;
    if (companyId) bumpLastActive(companyId, row.updated_at);
  }

  return companyList.map((company) => {
    const subscription =
      subscriptionsByCompany.get(company.id) ?? EMPTY_SUBSCRIPTION;
    const founder = founderProfiles.get(company.id);
    const sms = smsStats.get(company.id) ?? { outbound: 0, inbound: 0, failed: 0 };
    const etaCalculations = etaByCompany.get(company.id) ?? 0;
    const estimatedCostUsd = estimateCompanyCostUsd(
      {
        smsOutbound: sms.outbound,
        smsInbound: sms.inbound,
        smsFailed: sms.failed,
        etaCalculations,
      },
      assumptions,
      companyList.length
    );
    const estimatedRevenueUsd = estimateRevenueUsd(subscription.monthly_price);
    const estimatedMarginUsd = estimatedRevenueUsd - estimatedCostUsd;

    const base: CompanyUsageRow = {
      id: company.id,
      name: company.name,
      plan: subscription.plan as SubscriptionPlan,
      subscriptionStatus: subscription.status as SubscriptionStatus,
      trialEndsAt: subscription.trial_ends_at,
      monthlyPrice: subscription.monthly_price,
      billingCurrency: subscription.billing_currency as BillingCurrency,
      billingInterval: subscription.billing_interval,
      grandfathered: subscription.grandfathered,
      currentPeriodEnd: subscription.current_period_end,
      activeDogs: activeDogs.get(company.id) ?? 0,
      activeDrivers: activeDrivers.get(company.id) ?? 0,
      activeAdmins: activeAdmins.get(company.id) ?? 0,
      routesThisMonth: routesThisMonth.get(company.id) ?? 0,
      completedHikesThisMonth: completedByCompany.get(company.id) ?? 0,
      driverActionsThisMonth: driverActionsThisMonth.get(company.id) ?? 0,
      pendingRequestsThisMonth: pendingThisMonth.get(company.id) ?? 0,
      notificationsSent: notificationsSentByCompany.get(company.id) ?? 0,
      smsSent: sms.outbound,
      smsInbound: sms.inbound,
      smsFailed: sms.failed,
      etaCalculations,
      failedNotifications: failedNotifByCompany.get(company.id) ?? 0,
      webhookErrors: webhookErrorsByCompany.get(company.id) ?? 0,
      estimatedCostUsd,
      estimatedRevenueUsd,
      estimatedMarginUsd,
      lastActiveAt: lastActiveByCompany.get(company.id) ?? null,
      health: "healthy",
      alerts: [],
      caseStudyStatus: founder?.caseStudyStatus ?? "none",
      followUpDate: founder?.followUpDate ?? null,
    };

    base.health = computeHealthStatus(base);
    base.alerts = buildCompanyAlerts(base);
    return base;
  });
}

export async function getPlatformOverview(): Promise<{
  metrics: PlatformOverviewMetrics;
  companies: CompanyUsageRow[];
  alerts: ReturnType<typeof collectPlatformAlerts>;
}> {
  await requirePlatformOwner();
  const assumptions = await getCostAssumptions();
  const companies = await fetchCompanyUsageRows(assumptions);

  const activeCompanyIds = new Set(
    companies
      .filter((c) => {
        const days = c.lastActiveAt
          ? Math.floor(
              (Date.now() - new Date(c.lastActiveAt).getTime()) / 86_400_000
            )
          : 999;
        return (
          (c.subscriptionStatus === "active" || c.subscriptionStatus === "trial") &&
          days <= 30
        );
      })
      .map((c) => c.id)
  );

  const metrics: PlatformOverviewMetrics = {
    totalCompanies: companies.length,
    activeCompanies: activeCompanyIds.size,
    trialCompanies: companies.filter((c) => c.subscriptionStatus === "trial").length,
    payingCompanies: companies.filter(
      (c) =>
        c.monthlyPrice > 0 &&
        (c.subscriptionStatus === "active" || c.subscriptionStatus === "past_due")
    ).length,
    grandfatheredCompanies: companies.filter((c) => c.grandfathered).length,
    betaPartners: companies.filter((c) => c.plan === "beta_partner").length,
    atRiskCompanies: companies.filter((c) =>
      ["at_risk", "trial_inactive"].includes(c.health)
    ).length,
    caseStudyCandidates: companies.filter(
      (c) => c.health === "case_study_candidate" || c.caseStudyStatus === "candidate"
    ).length,
    activeDogs: companies.reduce((sum, c) => sum + c.activeDogs, 0),
    activeDrivers: companies.reduce((sum, c) => sum + c.activeDrivers, 0),
    activeAdmins: companies.reduce((sum, c) => sum + c.activeAdmins, 0),
    routesThisMonth: companies.reduce((sum, c) => sum + c.routesThisMonth, 0),
    completedHikesThisMonth: companies.reduce(
      (sum, c) => sum + c.completedHikesThisMonth,
      0
    ),
    driverActionsThisMonth: companies.reduce(
      (sum, c) => sum + c.driverActionsThisMonth,
      0
    ),
    pendingRequestsThisMonth: companies.reduce(
      (sum, c) => sum + c.pendingRequestsThisMonth,
      0
    ),
    notificationsSentThisMonth: companies.reduce(
      (sum, c) => sum + c.notificationsSent,
      0
    ),
    smsSentThisMonth: companies.reduce((sum, c) => sum + c.smsSent, 0),
    etaCalculationsThisMonth: companies.reduce(
      (sum, c) => sum + c.etaCalculations,
      0
    ),
    failedSmsThisMonth: companies.reduce((sum, c) => sum + c.smsFailed, 0),
    failedNotificationsThisMonth: companies.reduce(
      (sum, c) => sum + c.failedNotifications,
      0
    ),
    estimatedInfraCostUsd: companies.reduce((sum, c) => sum + c.estimatedCostUsd, 0),
    estimatedRevenueUsd: companies.reduce((sum, c) => sum + c.estimatedRevenueUsd, 0),
    estimatedGrossMarginUsd: companies.reduce(
      (sum, c) => sum + c.estimatedMarginUsd,
      0
    ),
    estimatedMrrUsd: companies
      .filter((c) =>
        ["active", "past_due", "trial"].includes(c.subscriptionStatus)
      )
      .reduce((sum, c) => sum + c.monthlyPrice, 0),
    payingMrrUsd: companies
      .filter(
        (c) =>
          c.monthlyPrice > 0 &&
          (c.subscriptionStatus === "active" || c.subscriptionStatus === "past_due")
      )
      .reduce((sum, c) => sum + c.monthlyPrice, 0),
    trialMrrPotentialUsd: companies
      .filter((c) => c.subscriptionStatus === "trial" && c.monthlyPrice > 0)
      .reduce((sum, c) => sum + c.monthlyPrice, 0),
    betaPartnerMrrUsd: companies
      .filter((c) => c.plan === "beta_partner" && c.monthlyPrice > 0)
      .reduce((sum, c) => sum + c.monthlyPrice, 0),
    grandfatheredMrrUsd: companies
      .filter((c) => c.grandfathered && c.monthlyPrice > 0)
      .reduce((sum, c) => sum + c.monthlyPrice, 0),
    activeSubscriptions: companies.filter((c) => c.subscriptionStatus === "active")
      .length,
    pastDueSubscriptions: companies.filter((c) => c.subscriptionStatus === "past_due")
      .length,
    cancelledSubscriptions: companies.filter(
      (c) => c.subscriptionStatus === "cancelled"
    ).length,
  };

  return {
    metrics,
    companies,
    alerts: collectPlatformAlerts(companies),
  };
}

export async function getPlatformTrends(
  period: "daily" | "monthly" = "daily"
): Promise<PlatformTrends> {
  await requirePlatformOwner();
  const supabase = createServiceClient();
  const rangeStart =
    period === "daily" ? daysAgoIso(30) : daysAgoIso(365);

  const [smsRes, notifRes, hikesRes, dogsRes, companiesRes] = await Promise.all([
    supabase
      .from("sms_messages")
      .select("created_at, direction, status")
      .eq("direction", "outbound")
      .gte("created_at", rangeStart),
    supabase
      .from("notification_log")
      .select("created_at, notification_type, status")
      .eq("notification_type", "en_route")
      .gte("created_at", rangeStart),
    supabase.from("hikes").select("id, date, created_at").gte("date", rangeStart.slice(0, 10)),
    supabase.from("dogs").select("created_at, is_active").eq("is_active", true),
    supabase.from("companies").select("created_at"),
  ]);

  const outboundSms = smsRes.data ?? [];
  const enRouteNotifs = notifRes.data ?? [];
  const hikes = hikesRes.data ?? [];

  let completedHikeRows: { created_at: string }[] = [];
  if (hikes.length > 0) {
    const { data: stops } = await supabase
      .from("stops")
      .select("hike_id, status, updated_at")
      .in(
        "hike_id",
        hikes.map((h) => h.id)
      )
      .in("status", ["picked_up", "dropped_off"]);

    const hikeDateMap = new Map(hikes.map((h) => [h.id, h.date]));
    const seen = new Set<string>();
    for (const stop of stops ?? []) {
      if (seen.has(stop.hike_id)) continue;
      seen.add(stop.hike_id);
      const date = hikeDateMap.get(stop.hike_id);
      if (date) completedHikeRows.push({ created_at: `${date}T12:00:00.000Z` });
    }
  }

  const smsFailed = (smsRes.data ?? []).filter((s) => s.status === "failed");
  const notifFailed = (notifRes.data ?? []).filter((n) => n.status === "failed");

  const failureRows = [
    ...smsFailed.map((s) => ({ created_at: s.created_at })),
    ...notifFailed.map((n) => ({ created_at: n.created_at })),
  ];
  const successRows = outboundSms.filter((s) => s.status !== "failed");

  const groupFn =
    period === "daily"
      ? (rows: { created_at: string }[]) =>
          groupCountByDate(rows, rangeStart.slice(0, 10), 30)
      : (rows: { created_at: string }[]) => groupCountByMonth(rows, 12);

  const failureTrend = groupFn(failureRows);
  const successTrend = groupFn(successRows);
  const failureRate: TrendPoint[] = failureTrend.map((point, i) => {
    const successes = successTrend[i]?.value ?? 0;
    const failures = point.value;
    const total = successes + failures;
    return {
      date: point.date,
      value: total > 0 ? failures / total : 0,
    };
  });

  const activeCompaniesTrend =
    period === "daily"
      ? groupCountByDate(companiesRes.data ?? [], rangeStart.slice(0, 10), 30)
      : groupCountByMonth(companiesRes.data ?? [], 12);

  return {
    smsSent: groupFn(outboundSms),
    etaCalculations: groupFn(enRouteNotifs),
    completedHikes: groupFn(completedHikeRows),
    activeCompanies: activeCompaniesTrend,
    activeDogs:
      period === "daily"
        ? groupCountByDate(dogsRes.data ?? [], rangeStart.slice(0, 10), 30)
        : groupCountByMonth(dogsRes.data ?? [], 12),
    failureRate,
  };
}

export async function getCompanyDetail(
  companyId: string
): Promise<CompanyDetailMetrics | null> {
  await requirePlatformOwner();
  const assumptions = await getCostAssumptions();
  const rows = await fetchCompanyUsageRows(assumptions, companyId);
  const row = rows[0];
  if (!row) return null;

  const supabase = createServiceClient();

  const [companyRes, routesRes, customersRes, events, profilesRes, founder] =
    await Promise.all([
      supabase
        .from("companies")
        .select("timezone, created_at")
        .eq("id", companyId)
        .single(),
      supabase
        .from("routes")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_active", true),
      listUsageEvents({ companyId, limit: 20 }),
      supabase
        .from("profiles")
        .select("full_name, role, updated_at")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(5),
      listFounderProfiles().then((m) => m.get(companyId) ?? null),
    ]);

  if (companyRes.error || !companyRes.data) return null;

  return {
    ...row,
    timezone: companyRes.data.timezone,
    createdAt: companyRes.data.created_at,
    totalRoutes: routesRes.count ?? 0,
    totalCustomers: customersRes.count ?? 0,
    internalNotes: founder?.internalNotes ?? null,
    customerQuote: founder?.customerQuote ?? null,
    recentEvents: events.filter((e) => e.level === "info").slice(0, 10),
    recentErrors: events.filter((e) => e.level !== "info").slice(0, 10),
    lastActiveUsers: (profilesRes.data ?? []).map((p) => ({
      name: p.full_name,
      role: p.role,
      lastSeen: p.updated_at,
    })),
  };
}

export async function listUsageEvents(options?: {
  companyId?: string;
  limit?: number;
}): Promise<UsageEvent[]> {
  await requirePlatformOwner();
  const supabase = createServiceClient();
  const limit = options?.limit ?? 100;

  const { data: companies } = await supabase.from("companies").select("id, name");
  const companyNameMap = new Map(
    (companies ?? []).map((c) => [c.id, c.name as string])
  );

  let smsQuery = supabase
    .from("sms_messages")
    .select("id, company_id, direction, status, body, error_message, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  let notifQuery = supabase
    .from("notification_log")
    .select(
      "id, company_id, notification_type, status, body, error_message, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  let systemQuery = supabase
    .from("system_logs")
    .select("id, company_id, level, category, message, context, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.companyId) {
    smsQuery = smsQuery.eq("company_id", options.companyId);
    notifQuery = notifQuery.eq("company_id", options.companyId);
    systemQuery = systemQuery.eq("company_id", options.companyId);
  }

  const [smsRes, notifRes, systemRes] = await Promise.all([
    smsQuery,
    notifQuery,
    systemQuery,
  ]);

  const events: UsageEvent[] = [];

  for (const sms of smsRes.data ?? []) {
    events.push({
      id: `sms-${sms.id}`,
      companyId: sms.company_id,
      companyName: companyNameMap.get(sms.company_id) ?? null,
      eventType: "sms",
      level: sms.status === "failed" ? "error" : "info",
      summary: `${sms.direction} SMS · ${sms.status}`,
      detail: sms.error_message ?? sms.body.slice(0, 120),
      createdAt: sms.created_at,
    });
  }

  for (const n of notifRes.data ?? []) {
    events.push({
      id: `notif-${n.id}`,
      companyId: n.company_id,
      companyName: companyNameMap.get(n.company_id) ?? null,
      eventType: "notification",
      level: n.status === "failed" ? "error" : "info",
      summary: `${n.notification_type} · ${n.status}`,
      detail: n.error_message ?? n.body.slice(0, 120),
      createdAt: n.created_at,
    });
  }

  for (const log of systemRes.data ?? []) {
    events.push({
      id: `sys-${log.id}`,
      companyId: log.company_id,
      companyName: log.company_id ? companyNameMap.get(log.company_id) ?? null : null,
      eventType: log.category === "webhook" ? "webhook" : "system",
      level: log.level === "error" ? "error" : log.level === "warn" ? "warn" : "info",
      summary: `${log.category} · ${log.level}`,
      detail: log.message,
      createdAt: log.created_at,
    });
  }

  return events
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
