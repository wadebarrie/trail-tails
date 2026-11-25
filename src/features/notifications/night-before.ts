import { createServiceClient } from "@/lib/supabase/service";
import { logErrorFromException, logInfo } from "@/lib/logger";
import { getDateInTimezone, getUtcBoundsForLocalDate } from "@/lib/dates";
import {
  nightBeforeBudgetExhausted,
  nightBeforeConfirmPlan,
  nightBeforePhonesToSend,
  nightBeforePriorDecision,
  nightBeforeSendDecision,
} from "@/features/notifications/night-before-schedule";
import { syncStopsForDate } from "@/features/hikes/sync-stops";
import { logNotification, buildNightBeforeMessage, buildNightBeforeMultiWindowMessage } from "@/features/notifications/log";
import { listCustomerContacts } from "@/lib/customer-contacts";
import { one } from "@/lib/supabase/relations";
import { findRecentOutboundSms, getSmsRedirectTo } from "@/lib/twilio";
import {
  NIGHT_BEFORE_CRON_BUDGET_MS,
  SMS_LOOKUP_MAX_MS,
  galleryWireMessage,
} from "@/lib/twilio/outcome";
import {
  SMS_CALL_FLOOR_MS,
  runWithSmsBudget,
  smsBudgetRemaining,
  takeSmsSlice,
} from "@/lib/sms-budget";

const DEFAULT_NIGHT_BEFORE_REMINDER_TIME = "19:30:00";

type NightBeforeLogRow = {
  id: string;
  status: string;
  error_message: string | null;
  body: string | null;
  created_at?: string;
};

/** Send night-before pickup reminders after the company's configured local time. */
export async function sendNightBeforeRemindersForCompany(
  companyId: string,
  timeZone: string,
  reminderTime = DEFAULT_NIGHT_BEFORE_REMINDER_TIME,
  at = new Date()
): Promise<{ skipped: true; reason: string } | { sent: number }> {
  return runWithSmsBudget(() =>
    deliverNightBeforeReminders(companyId, timeZone, reminderTime, at)
  );
}

async function deliverNightBeforeReminders(
  companyId: string,
  timeZone: string,
  reminderTime: string,
  at: Date
): Promise<{ skipped: true; reason: string } | { sent: number }> {
  if (nightBeforeBudgetExhausted(smsBudgetRemaining())) {
    return { skipped: true as const, reason: "budget" };
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
      .select("id, status, error_message, body, created_at")
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
    if (prior === "skip") {
      await dismissBudgetSkips(supabase, (priorRows ?? []) as NightBeforeLogRow[]);
      continue;
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

    const previewBody =
      typeof body === "function" ? body("Owner") : body;
    const contacts = await loadNightBeforeContacts(supabase, customerId);
    if (!contacts.length) continue;
    const bodyFor = (ownerName: string) =>
      typeof body === "function" ? body(ownerName) : previewBody;
    const logRows = (priorRows ?? []) as NightBeforeLogRow[];
    const confirmed =
      prior === "confirm"
        ? await confirmUnconfirmedContacts(logRows, contacts, bodyFor)
        : {
            sentRowIds: [] as string[],
            retryPhones: [] as string[],
            holdPhones: [] as string[],
            sentPhones: [] as string[],
          };
    if (confirmed.sentRowIds.length) {
      await supabase
        .from("notification_log")
        .update({ status: "sent" })
        .in("id", confirmed.sentRowIds);
      for (const row of logRows) {
        if (confirmed.sentRowIds.includes(row.id)) row.status = "sent";
      }
    }

    const targets = nightBeforePhonesToSend({
      contacts,
      rows: (priorRows ?? []).map((row) => ({
        status: row.status as string,
        errorMessage: (row.error_message as string | null) ?? null,
        body: (row.body as string) ?? "",
      })),
      bodyFor,
    });
    let onlyPhones = targets.phones;
    if (prior === "confirm" && targets.ambiguous) {
      onlyPhones = confirmed.retryPhones;
    } else if (targets.ambiguous) {
      const looked = await phonesAbsentSince(
        contacts,
        typeof body === "function" ? body : () => previewBody,
        new Date(startIso)
      );
      onlyPhones = looked.phones;
      if (!onlyPhones.length) {
        if (!looked.inconclusive) {
          await dismissBudgetSkips(
            supabase,
            (priorRows ?? []) as NightBeforeLogRow[]
          );
        }
        continue;
      }
    } else if (!onlyPhones.length && !confirmed.retryPhones.length) {
      await dismissBudgetSkips(supabase, logRows);
      continue;
    }
    const alreadyDecided = new Set([
      ...confirmed.holdPhones,
      ...confirmed.sentPhones,
    ]);
    onlyPhones = [...new Set([...onlyPhones, ...confirmed.retryPhones])].filter(
      (phone) => !alreadyDecided.has(phone)
    );
    if (!onlyPhones.length) {
      await dismissBudgetSkips(supabase, logRows);
      continue;
    }

    const result = await logNotification({
      companyId,
      customerId,
      dogId: undefined,
      stopId: stopIds[0],
      notificationType: "night_before",
      body,
      onlyPhones,
    });

    if (result.sent > 0) {
      sent += 1;
      await dismissBudgetSkips(supabase, (priorRows ?? []) as NightBeforeLogRow[]);
    }
  }

  return { sent };
}

async function confirmUnconfirmedContacts(
  rows: NightBeforeLogRow[],
  contacts: { phone: string; ownerName: string }[],
  bodyFor: (ownerName: string) => string
): Promise<{
  sentRowIds: string[];
  retryPhones: string[];
  holdPhones: string[];
  sentPhones: string[];
}> {
  const plan = nightBeforeConfirmPlan({
    contacts,
    rows: rows.map((row) => ({
      id: row.id,
      status: row.status,
      errorMessage: row.error_message,
      body: row.body ?? "",
      createdAt: row.created_at,
    })),
    bodyFor,
  });
  const sentRowIds: string[] = [];
  const retryPhones: string[] = [];
  const holdPhones: string[] = [];
  const sentPhones: string[] = [];

  for (const match of plan.unique) {
    const outcome = await lookupNightBeforeContact(
      { phone: match.phone, ownerName: match.ownerName },
      match.body,
      match.createdAt
    );
    if (outcome === "sent") {
      sentRowIds.push(match.rowId);
      sentPhones.push(match.phone);
    } else if (outcome === "failed") retryPhones.push(match.phone);
    else holdPhones.push(match.phone);
  }

  for (const group of plan.shared) {
    const outcomes: ("sent" | "failed" | "unknown")[] = [];
    for (const contact of group.contacts) {
      const outcome = await lookupNightBeforeContact(
        contact,
        group.body,
        group.createdAt
      );
      outcomes.push(outcome);
      if (outcome === "sent") sentPhones.push(contact.phone);
      else if (outcome === "failed") retryPhones.push(contact.phone);
      else holdPhones.push(contact.phone);
    }
    if (outcomes.length > 0 && outcomes.every((outcome) => outcome === "sent")) {
      sentRowIds.push(...group.rowIds);
    }
  }

  return { sentRowIds, retryPhones, holdPhones, sentPhones };
}

async function lookupNightBeforeContact(
  contact: { phone: string; ownerName: string },
  loggedBody: string,
  createdAt?: string
): Promise<"sent" | "failed" | "unknown"> {
  const timeout = takeSmsSlice(SMS_LOOKUP_MAX_MS);
  if (timeout == null) return "unknown";
  const wire = galleryWireMessage({
    phone: contact.phone,
    ownerName: contact.ownerName,
    loggedBody,
    redirectTo: getSmsRedirectTo(),
  });
  const lookedUp = await findRecentOutboundSms(
    wire.to,
    wire.body,
    timeout,
    createdAt ? new Date(createdAt) : undefined
  );
  if (lookedUp.outcome === "sent") return "sent";
  if (lookedUp.outcome === "failed") return "failed";
  return "unknown";
}

export async function runNightBeforeCron(): Promise<
  { companyId: string; sent?: number; skipped?: string }[]
> {
  return runWithSmsBudget(() => runNightBeforeCronNow(), NIGHT_BEFORE_CRON_BUDGET_MS);
}

async function runNightBeforeCronNow(): Promise<
  { companyId: string; sent?: number; skipped?: string }[]
> {
  const supabase = createServiceClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("id, timezone, name, night_before_reminder_time");

  const results: { companyId: string; sent?: number; skipped?: string }[] = [];

  for (const company of companies ?? []) {
    if (nightBeforeBudgetExhausted(smsBudgetRemaining())) {
      results.push({ companyId: company.id, skipped: "budget" });
      break;
    }
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

async function loadNightBeforeContacts(
  supabase: ReturnType<typeof createServiceClient>,
  customerId: string
) {
  const { data: customer } = await supabase
    .from("customers")
    .select("owner_name, phone, secondary_owner_name, secondary_phone")
    .eq("id", customerId)
    .maybeSingle();
  if (!customer) return [];
  return listCustomerContacts({
    owner_name: (customer.owner_name as string) ?? "",
    phone: (customer.phone as string) ?? "",
    secondary_owner_name: (customer.secondary_owner_name as string | null) ?? null,
    secondary_phone: (customer.secondary_phone as string | null) ?? null,
  });
}

async function dismissBudgetSkips(
  supabase: ReturnType<typeof createServiceClient>,
  rows: NightBeforeLogRow[]
) {
  const ids = rows
    .filter(
      (row) =>
        row.status === "pending" &&
        (row.error_message ?? "").includes("budget exhausted")
    )
    .map((row) => row.id);
  if (!ids.length) return;
  await supabase.from("notification_log").delete().in("id", ids);
}

/** Same logged body for both contacts: ask Twilio, per phone, since this morning. */
async function phonesAbsentSince(
  contacts: { phone: string; ownerName: string }[],
  bodyFor: (ownerName: string) => string,
  sentAfter: Date
): Promise<{ phones: string[]; inconclusive: boolean }> {
  const redirectTo = getSmsRedirectTo();
  const phones: string[] = [];
  let inconclusive = false;
  for (const contact of contacts) {
    const timeout = takeSmsSlice(SMS_LOOKUP_MAX_MS);
    if (timeout == null) return { phones, inconclusive: true };
    const wire = galleryWireMessage({
      phone: contact.phone,
      ownerName: contact.ownerName,
      loggedBody: bodyFor(contact.ownerName),
      redirectTo,
    });
    const lookedUp = await findRecentOutboundSms(
      wire.to,
      wire.body,
      timeout,
      sentAfter
    );
    if (lookedUp.outcome === "absent") phones.push(contact.phone);
    else if (lookedUp.outcome !== "sent") inconclusive = true;
  }
  return { phones, inconclusive };
}
