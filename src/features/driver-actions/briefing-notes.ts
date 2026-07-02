import { createClient } from "@/lib/supabase/server";
import { addDaysToDate } from "@/features/hikes/sync-stops";

export type DriverBriefingNote = {
  text: string;
};

function exceptionActiveOnDate(
  startDate: string,
  endDate: string | null,
  date: string
): boolean {
  const end = endDate ?? "9999-12-31";
  return date >= startDate && date <= end;
}

/** Day-level notes for the morning briefing — empty array means hide the section. */
export async function getDriverBriefingNotes(
  companyId: string,
  date: string,
  routeIds: string[]
): Promise<DriverBriefingNote[]> {
  if (routeIds.length === 0) return [];

  const supabase = await createClient();

  const { data: routeDogs } = await supabase
    .from("dogs")
    .select("id, created_at")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .in("route_id", routeIds);

  const dogs = routeDogs ?? [];
  const dogIds = dogs.map((d) => d.id);
  if (dogIds.length === 0) return [];

  const notes: DriverBriefingNote[] = [];

  const { data: exceptions } = await supabase
    .from("schedule_exceptions")
    .select("dog_id, exception_type, reason, start_date, end_date")
    .in("dog_id", dogIds);

  const activeExceptions = (exceptions ?? []).filter((ex) =>
    exceptionActiveOnDate(ex.start_date, ex.end_date, date)
  );

  const skippedCount = activeExceptions.filter(
    (ex) => ex.exception_type !== "pause"
  ).length;

  if (skippedCount > 0) {
    notes.push({
      text: `${skippedCount} dog${skippedCount === 1 ? "" : "s"} skipped`,
    });
  }

  const newDogCutoff = addDaysToDate(date, -7);
  const newDogCount = dogs.filter((d) => {
    const created = d.created_at.slice(0, 10);
    return created >= newDogCutoff && created <= date;
  }).length;

  if (newDogCount > 0) {
    notes.push({
      text: `${newDogCount} new dog${newDogCount === 1 ? "" : "s"} added`,
    });
  }

  const customerIds = new Set<string>();
  const { data: dogCustomers } = await supabase
    .from("dogs")
    .select("customer_id")
    .in("id", dogIds);

  for (const row of dogCustomers ?? []) {
    customerIds.add(row.customer_id);
  }

  const latePickupCount = activeExceptions.filter((ex) =>
    (ex.reason ?? "").toLowerCase().includes("late")
  ).length;

  if (latePickupCount > 0) {
    notes.push({
      text: `${latePickupCount} customer${latePickupCount === 1 ? "" : "s"} requested a late pickup`,
    });
  } else if (customerIds.size > 0) {
    const { data: pendingLate } = await supabase
      .from("pending_requests")
      .select("id, raw_body, parsed_payload")
      .eq("company_id", companyId)
      .eq("status", "pending")
      .in("customer_id", [...customerIds]);

    const lateRequestCount = (pendingLate ?? []).filter((req) => {
      const body = req.raw_body.toLowerCase();
      const payload = JSON.stringify(req.parsed_payload ?? {}).toLowerCase();
      return body.includes("late") || payload.includes("late");
    }).length;

    if (lateRequestCount > 0) {
      notes.push({
        text: `${lateRequestCount} customer${lateRequestCount === 1 ? "" : "s"} requested a late pickup`,
      });
    }
  }

  return notes;
}
