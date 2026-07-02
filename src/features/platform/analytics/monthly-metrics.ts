import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformOwner } from "@/features/platform/queries";
import type { MonthlyCompanyMetrics } from "@/features/platform/analytics/operational-review";
import { monthRangeUtc } from "@/features/platform/analytics/operational-review";

export async function fetchMonthlyCompanyMetrics(
  companyId: string,
  reviewMonth: string
): Promise<MonthlyCompanyMetrics> {
  await requirePlatformOwner();
  const supabase = createServiceClient();
  const { start, end } = monthRangeUtc(reviewMonth);
  const monthStartDate = reviewMonth + "-01";
  const monthEndDate = end.slice(0, 10);

  const [
    dogsRes,
    driversRes,
    adminsRes,
    routesRes,
    hikesRes,
    stopsRes,
    notifRes,
    smsRes,
    pendingRes,
  ] = await Promise.all([
    supabase
      .from("dogs")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("is_active", true),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("role", "driver")
      .eq("is_active", true),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("role", "admin")
      .eq("is_active", true),
    supabase
      .from("routes")
      .select("id")
      .eq("company_id", companyId)
      .gte("created_at", start)
      .lte("created_at", end),
    supabase
      .from("hikes")
      .select("id, status")
      .eq("company_id", companyId)
      .gte("date", monthStartDate)
      .lte("date", monthEndDate),
    supabase
      .from("stops")
      .select("status, stop_type, updated_at, hikes!inner(company_id)")
      .eq("hikes.company_id", companyId)
      .gte("updated_at", start)
      .lte("updated_at", end),
    supabase
      .from("notification_log")
      .select("notification_type, status")
      .eq("company_id", companyId)
      .gte("created_at", start)
      .lte("created_at", end),
    supabase
      .from("sms_messages")
      .select("direction")
      .eq("company_id", companyId)
      .eq("direction", "inbound")
      .gte("created_at", start)
      .lte("created_at", end),
    supabase
      .from("pending_requests")
      .select("status, command_type")
      .eq("company_id", companyId)
      .gte("created_at", start)
      .lte("created_at", end),
  ]);

  const hikes = hikesRes.data ?? [];
  const hikeIds = hikes.map((h) => h.id);
  let billableHikes = 0;

  if (hikeIds.length > 0) {
    const { data: completedStops } = await supabase
      .from("stops")
      .select("hike_id, status, stop_type")
      .in("hike_id", hikeIds);

    const hikesWithPickup = new Set<string>();
    for (const stop of completedStops ?? []) {
      if (stop.stop_type === "pickup" && stop.status === "picked_up") {
        hikesWithPickup.add(stop.hike_id);
      }
    }
    billableHikes = hikesWithPickup.size;
  }

  let pickupActions = 0;
  let dropoffActions = 0;
  let driverActions = 0;
  for (const stop of stopsRes.data ?? []) {
    if (stop.status === "picked_up") {
      pickupActions += 1;
      driverActions += 1;
    }
    if (stop.status === "dropped_off") {
      dropoffActions += 1;
      driverActions += 1;
    }
    if (stop.status === "en_route" || stop.status === "arrived") {
      driverActions += 1;
    }
  }

  let notificationsSent = 0;
  let etaNotifications = 0;
  let nightBeforeReminders = 0;
  let pickupConfirmations = 0;
  let dropoffConfirmations = 0;
  let failedNotifications = 0;

  for (const n of notifRes.data ?? []) {
    if (n.status !== "failed") notificationsSent += 1;
    else failedNotifications += 1;

    switch (n.notification_type) {
      case "en_route":
        etaNotifications += 1;
        break;
      case "night_before":
        nightBeforeReminders += 1;
        break;
      case "picked_up":
        pickupConfirmations += 1;
        break;
      case "dropped_off":
        dropoffConfirmations += 1;
        break;
    }
  }

  let pendingRequestsApproved = 0;
  let pendingRequestsDeclined = 0;
  let skipRequests = 0;
  let pauseResumeRequests = 0;

  for (const req of pendingRes.data ?? []) {
    if (req.status === "approved") pendingRequestsApproved += 1;
    if (req.status === "declined") pendingRequestsDeclined += 1;
    if (
      req.command_type === "skip_tomorrow" ||
      req.command_type === "skip_weekday" ||
      req.command_type === "skip_date"
    ) {
      skipRequests += 1;
    }
    if (
      req.command_type === "pause" ||
      req.command_type === "resume" ||
      req.command_type === "vacation"
    ) {
      pauseResumeRequests += 1;
    }
  }

  const hikesCompleted =
    hikes.filter((h) => h.status === "completed").length ||
    new Set(
      (stopsRes.data ?? [])
        .filter((s) => s.status === "picked_up" || s.status === "dropped_off")
        .map((s) => s.updated_at.slice(0, 10))
    ).size;

  return {
    activeDogs: dogsRes.count ?? 0,
    activeDrivers: driversRes.count ?? 0,
    activeAdmins: adminsRes.count ?? 0,
    routesCreated: routesRes.data?.length ?? 0,
    hikesCompleted,
    pickupActions,
    dropoffActions,
    driverActions,
    notificationsSent,
    etaNotifications,
    nightBeforeReminders,
    pickupConfirmations,
    dropoffConfirmations,
    failedNotifications,
    inboundSmsRequests: smsRes.data?.length ?? 0,
    pendingRequestsTotal: pendingRes.data?.length ?? 0,
    pendingRequestsApproved,
    pendingRequestsDeclined,
    skipRequests,
    pauseResumeRequests,
    billableHikes,
    billingPeriodHikes: hikes.length,
  };
}
