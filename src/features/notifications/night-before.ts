import { createServiceClient } from "@/lib/supabase/service";
import { logErrorFromException, logInfo } from "@/lib/logger";
import { getDateInTimezone, getUtcBoundsForLocalDate } from "@/lib/dates";
import {
  nightBeforePriorDecision,
  nightBeforeSendDecision,
} from "@/features/notifications/night-before-schedule";
import { syncStopsForDate } from "@/features/hikes/sync-stops";
import { logNotification, buildNightBeforeMessage, buildNightBeforeMultiWindowMessage } from "@/features/notifications/log";
import { listCustomerContacts } from "@/lib/customer-contacts";
import { one } from "@/lib/supabase/relations";
import { findRecentOutboundSms, getSmsRedirectTo } from "@/lib/twilio";
import { SMS_LOOKUP_MAX_MS, galleryWireMessage } from "@/lib/twilio/outcome";
import {
  SMS_CALL_FLOOR_MS,
  runWithSmsBudget,
  smsBudgetActive,
  smsBudgetRemaining,
  takeSmsSlice,
} from "@/lib/sms-budget";

const DEFAULT_NIGHT_BEFORE_REMINDER_TIME = "19:30:00";

/** Send night-before pickup reminders after the company's configured local time. */
export async function sendNightBeforeRemindersForCompany(
  companyId: string,
  timeZone: string,
  reminderTime = DEFAULT_NIGHT_BEFORE_REMINDER_TIME,
  at = new Date()
): Promise<{ skipped: true; reason: string } | { sent: number }> {
  if (!smsBudgetActive()) {
    return runWithSmsBudget(() =>
      sendNightBeforeRemindersForCompany(companyId, timeZone, reminderTime, at)
    );
  }
  const today = getDateInTimezone(timeZone, 0);
  const tomorrow = getDateInTimezone(timeZone, 1);
  const decision = nightBeforeSendDecision(timeZone, reminderTime, at);

  // Morning sync: today for drivers, tomorrow so the office can plan daytime.
  if (!decision.send && decision.reason === "morning_sync") {
    await Promise.all([
      syncStopsForDate(companyId, today),
      syncStopsForDate(companyId, tomorrow),
    ]);
    return { skipped: true as const, reason: "morning_sync" as const };
  }

  if (!decision.send) {
    return { skipped: true as const, reason: decision.reason };
  }

  const supabase = createServiceClient();

  await syncStopsForDate(companyId, tomorrow);

  const { data: hikes } = await supabase
    .from("hikes")
    .select("id, driver_id")
    .eq("company_id", companyId)
    .eq("date", tomorrow);

  const hikeIds = (hikes ?? []).map((h) => h.id);
  if (!hikeIds.length) return { skipped: true as const, reason: "no_hike" };

  const driverIds = [
    ...new Set(
      (hikes ?? [])
        .map((h) => h.driver_id)
        .filter((id): id is string => id != null)
    ),
  ];

  const driverFirstNameById = new Map<string, string>();
  if (driverIds.length > 0) {
    const { data: drivers } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", driverIds);

    for (const driver of drivers ?? []) {
      driverFirstNameById.set(driver.id, driver.full_name.split(" ")[0] ?? driver.full_name);
    }
  }

  const driverFirstNameByHikeId = new Map<string, string | null>(
    (hikes ?? []).map((h) => [
      h.id,
      h.driver_id ? driverFirstNameById.get(h.driver_id) ?? null : null,
    ])
  );

  const { data: stops } = await supabase
    .from("stops")
    .select(
      `
      id,
      hike_id,
      window_start,
      window_end,
      status,
      dog_id,
      dogs (
        name,
        customer_id,
        customers ( owner_name, phone, night_before_reminders_enabled )
      )
    `
    )
    .in("hike_id", hikeIds)
    .eq("stop_type", "pickup")
    .eq("status", "scheduled");

  if (!stops?.length) return { sent: 0 };

  type CustomerBucket = {
    customerId: string;
    dogNames: string[];
    stopIds: string[];
    windows: { start: string; end: string }[];
    driverFirstNames: (string | null)[];
  };

  const byCustomer = new Map<string, CustomerBucket>();

  for (const stop of stops) {
    const dog = one(
      stop.dogs as
        | { name: string; customer_id: string; customers: unknown }
        | { name: string; customer_id: string; customers: unknown }[]
        | null
    );
    const customer = one(
      dog?.customers as
        | {
            owner_name: string;
            phone: string;
            night_before_reminders_enabled: boolean;
          }
        | {
            owner_name: string;
            phone: string;
            night_before_reminders_enabled: boolean;
          }[]
        | null
    );
    if (!dog || !customer) continue;
    if (!customer.night_before_reminders_enabled) continue;

    const customerId = dog.customer_id;

    const bucket: CustomerBucket = byCustomer.get(customerId) ?? {
      customerId,
      dogNames: [],
      stopIds: [],
      windows: [],
      driverFirstNames: [],
    };
    bucket.dogNames.push(dog.name);
    bucket.stopIds.push(stop.id);
    bucket.windows.push({ start: stop.window_start, end: stop.window_end });
    bucket.driverFirstNames.push(
      driverFirstNameByHikeId.get(stop.hike_id) ?? null
    );
    byCustomer.set(customerId, bucket);
  }

  let sent = 0;

  for (const { customerId, dogNames, stopIds, windows, driverFirstNames } of byCustomer.values()) {
    const remaining = smsBudgetRemaining();
    if (remaining != null && remaining < SMS_CALL_FLOOR_MS) break;

    const { startIso, endIso } = getUtcBoundsForLocalDate(timeZone, today);

    const { data: priorRows } = await supabase
      .from("notification_log")
      .select("id, status, error_message, body")
      .eq("company_id", companyId)
      .eq("customer_id", customerId)
      .eq("notification_type", "night_before")
      .gte("created_at", startIso)
      .lt("created_at", endIso)
      .order("created_at", { ascending: false });

    const prior = nightBeforePriorDecision(
      (priorRows ?? []).map((row) => ({
        status: row.status as string,
        errorMessage: (row.error_message as string | null) ?? null,
      }))
    );
    if (prior === "skip") continue;
    if (prior === "confirm") {
      const loggedBody = (priorRows ?? []).find((row) => row.body)?.body as
        | string
        | undefined;
      const confirmed = loggedBody
        ? await confirmPendingNightBefore(supabase, customerId, loggedBody)
        : "unknown";
      if (confirmed === "sent") {
        const pendingIds = (priorRows ?? [])
          .filter((row) => row.status === "pending")
          .map((row) => row.id as string);
        if (pendingIds.length) {
          await supabase
            .from("notification_log")
            .update({ status: "sent" })
            .in("id", pendingIds);
        }
        continue;
      }
      if (confirmed !== "failed") continue;
    }

    const sameWindow = windows.every(
      (w) => w.start === windows[0].start && w.end === windows[0].end
    );

    const body = sameWindow
      ? (ownerName: string) =>
          buildNightBeforeMessage(
            ownerName,
            dogNames,
            windows[0].start,
            windows[0].end,
            driverFirstNames
          )
      : buildNightBeforeMultiWindowMessage(
          dogNames.map((name, i) => ({
            dogName: name,
            windowStart: windows[i].start,
            windowEnd: windows[i].end,
            driverFirstName: driverFirstNames[i],
          }))
        );

    const result = await logNotification({
      companyId,
      customerId,
      dogId: undefined,
      stopId: stopIds[0],
      notificationType: "night_before",
      body,
    });

    if (result.sent > 0) sent += 1;
  }

  return { sent };
}

async function confirmPendingNightBefore(
  supabase: ReturnType<typeof createServiceClient>,
  customerId: string,
  loggedBody: string
): Promise<"sent" | "failed" | "unknown"> {
  const { data: customer } = await supabase
    .from("customers")
    .select("owner_name, phone, secondary_owner_name, secondary_phone")
    .eq("id", customerId)
    .maybeSingle();
  if (!customer) return "unknown";

  const contacts = listCustomerContacts({
    owner_name: (customer.owner_name as string) ?? "",
    phone: (customer.phone as string) ?? "",
    secondary_owner_name: (customer.secondary_owner_name as string | null) ?? null,
    secondary_phone: (customer.secondary_phone as string | null) ?? null,
  });
  if (!contacts.length) return "unknown";

  const redirectTo = getSmsRedirectTo();
  let sawFailure = false;
  for (const contact of contacts) {
    const timeout = takeSmsSlice(SMS_LOOKUP_MAX_MS);
    if (timeout == null) return "unknown";
    const wire = galleryWireMessage({
      phone: contact.phone,
      ownerName: contact.ownerName,
      loggedBody,
      redirectTo,
    });
    const lookedUp = await findRecentOutboundSms(wire.to, wire.body, timeout);
    if (lookedUp.outcome === "sent") return "sent";
    if (lookedUp.outcome === "unknown") return "unknown";
    sawFailure = true;
  }
  return sawFailure ? "failed" : "unknown";
}

export async function runNightBeforeCron(): Promise<
  { companyId: string; sent?: number; skipped?: string }[]
> {
  // Each company starts its own budget inside sendNightBeforeRemindersForCompany.
  const supabase = createServiceClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("id, timezone, name, night_before_reminder_time");

  const results: { companyId: string; sent?: number; skipped?: string }[] = [];

  for (const company of companies ?? []) {
    const timeZone = company.timezone ?? "America/Los_Angeles";
    const reminderTime =
      company.night_before_reminder_time ?? DEFAULT_NIGHT_BEFORE_REMINDER_TIME;
    try {
      const result = await sendNightBeforeRemindersForCompany(
        company.id,
        timeZone,
        reminderTime
      );
      if ("sent" in result) {
        const count = result.sent ?? 0;
        results.push({ companyId: company.id, sent: count });
        if (count > 0) {
          logInfo("cron", "Night-before reminders sent", {
            companyId: company.id,
            context: { sent: count, companyName: company.name, reminderTime },
          });
        }
      } else {
        results.push({ companyId: company.id, skipped: result.reason });
      }
    } catch (error) {
      logErrorFromException(
        "cron",
        "Night-before cron failed for company",
        error,
        { companyId: company.id }
      );
      results.push({ companyId: company.id, skipped: "error" });
    }
  }

  return results;
}
