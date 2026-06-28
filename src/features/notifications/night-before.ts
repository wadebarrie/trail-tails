import { createServiceClient } from "@/lib/supabase/service";
import { logErrorFromException, logInfo } from "@/lib/logger";
import { getDateInTimezone, formatTime } from "@/lib/dates";
import { syncStopsForDate } from "@/features/hikes/sync-stops";
import { logNotification, buildNightBeforeMessage } from "@/features/notifications/log";
import { one } from "@/lib/supabase/relations";

function localHourInTimezone(timeZone: string): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hour12: false,
  }).format(new Date());
  return Number(hour);
}

/** Send night-before pickup reminders when local hour is 18 (6 PM). */
export async function sendNightBeforeRemindersForCompany(
  companyId: string,
  timeZone: string
) {
  if (localHourInTimezone(timeZone) !== 18) {
    return { skipped: true as const, reason: "not_6pm" };
  }

  const supabase = createServiceClient();
  const tomorrow = getDateInTimezone(timeZone, 1);
  const today = getDateInTimezone(timeZone, 0);

  await syncStopsForDate(companyId, tomorrow);

  const { data: hikes } = await supabase
    .from("hikes")
    .select("id")
    .eq("company_id", companyId)
    .eq("date", tomorrow);

  const hikeIds = (hikes ?? []).map((h) => h.id);
  if (!hikeIds.length) return { skipped: true as const, reason: "no_hike" };

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
    };
    bucket.dogNames.push(dog.name);
    bucket.stopIds.push(stop.id);
    bucket.windows.push({ start: stop.window_start, end: stop.window_end });
    byCustomer.set(customerId, bucket);
  }

  let sent = 0;

  for (const { customerId, dogNames, stopIds, windows } of byCustomer.values()) {
    const { data: alreadySent } = await supabase
      .from("notification_log")
      .select("id")
      .eq("company_id", companyId)
      .eq("customer_id", customerId)
      .eq("notification_type", "night_before")
      .gte("created_at", `${today}T00:00:00.000Z`)
      .limit(1);

    if (alreadySent?.length) continue;

    const sameWindow = windows.every(
      (w) => w.start === windows[0].start && w.end === windows[0].end
    );

    const body = sameWindow
      ? (ownerName: string) =>
          buildNightBeforeMessage(
            ownerName,
            dogNames,
            windows[0].start,
            windows[0].end
          )
      : `Tomorrow's pickups: ${dogNames
          .map((name, i) => {
            const w = windows[i];
            return `${name} (${formatTime(w.start)}–${formatTime(w.end)})`;
          })
          .join(", ")}.`;

    await logNotification({
      companyId,
      customerId,
      dogId: undefined,
      stopId: stopIds[0],
      notificationType: "night_before",
      body,
    });

    sent += 1;
  }

  return { sent };
}

export async function runNightBeforeCron() {
  const supabase = createServiceClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("id, timezone, name");

  const results: { companyId: string; sent?: number; skipped?: string }[] = [];

  for (const company of companies ?? []) {
    const timeZone = company.timezone ?? "America/Los_Angeles";
    try {
      const result = await sendNightBeforeRemindersForCompany(
        company.id,
        timeZone
      );
      if ("sent" in result) {
        const count = result.sent ?? 0;
        results.push({ companyId: company.id, sent: count });
        if (count > 0) {
          logInfo("cron", "Night-before reminders sent", {
            companyId: company.id,
            context: { sent: count, companyName: company.name },
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
