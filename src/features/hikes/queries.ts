import { getCurrentProfile } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getDayOfWeek } from "@/lib/dates";
import type { StopType } from "@/types";

type ExceptionRow = {
  dog_id: string;
  start_date: string;
  end_date: string | null;
};

function isBlockedByException(
  dogId: string,
  date: string,
  exceptions: ExceptionRow[]
): boolean {
  return exceptions.some((ex) => {
    if (ex.dog_id !== dogId) return false;
    const end = ex.end_date ?? "9999-12-31";
    return date >= ex.start_date && date <= end;
  });
}

/** Ensure a hike exists for the date and stops are generated from schedules. */
export async function ensureHikeForDate(companyId: string, date: string) {
  const profile = await getCurrentProfile();
  if (
    !profile?.is_active ||
    profile.company_id !== companyId ||
    (profile.role !== "admin" && profile.role !== "driver")
  ) {
    throw new Error("Unauthorized");
  }

  // Service role bypasses RLS for hike/stop generation (drivers lack INSERT policies).
  const supabase = createServiceClient();

  const { data: company } = await supabase
    .from("companies")
    .select("timezone")
    .eq("id", companyId)
    .single();

  const timeZone = company?.timezone ?? "America/Los_Angeles";
  const dayOfWeek = getDayOfWeek(date, timeZone);

  let { data: hike } = await supabase
    .from("hikes")
    .select("id")
    .eq("company_id", companyId)
    .eq("date", date)
    .maybeSingle();

  if (!hike) {
    const { data: created, error } = await supabase
      .from("hikes")
      .insert({ company_id: companyId, date })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    hike = created;
  }

  const { data: dogs } = await supabase
    .from("dogs")
    .select(
      `
      id,
      pickup_window_start,
      pickup_window_end,
      route_sort_order,
      dog_schedule_days ( day_of_week )
    `
    )
    .eq("company_id", companyId)
    .eq("is_active", true);

  type DogSchedule = {
    id: string;
    pickup_window_start: string;
    pickup_window_end: string;
    route_sort_order: number;
    dog_schedule_days: { day_of_week: number }[];
  };

  const scheduledDogs = ((dogs ?? []) as DogSchedule[]).filter((dog) =>
    dog.dog_schedule_days.some((d) => d.day_of_week === dayOfWeek)
  );

  const dogIds = scheduledDogs.map((d) => d.id);

  const { data: exceptions } =
    dogIds.length > 0
      ? await supabase
          .from("schedule_exceptions")
          .select("dog_id, start_date, end_date")
          .in("dog_id", dogIds)
      : { data: [] };

  const eligible = scheduledDogs.filter(
    (d) => !isBlockedByException(d.id, date, exceptions ?? [])
  );

  for (const dog of eligible) {
    for (const stopType of ["pickup", "dropoff"] as StopType[]) {
      const { data: existing } = await supabase
        .from("stops")
        .select("id")
        .eq("hike_id", hike.id)
        .eq("dog_id", dog.id)
        .eq("stop_type", stopType)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from("stops").insert({
          hike_id: hike.id,
          dog_id: dog.id,
          stop_type: stopType,
          window_start: dog.pickup_window_start,
          window_end: dog.pickup_window_end,
          sort_order: dog.route_sort_order,
        });
        if (error) throw new Error(error.message);
      }
    }
  }

  return hike.id;
}

export async function getHikeWithStops(companyId: string, date: string) {
  await ensureHikeForDate(companyId, date);

  const supabase = await createClient();

  const { data: hike } = await supabase
    .from("hikes")
    .select(
      `
      id,
      date,
      status,
      driver_id,
      stops (
        id,
        dog_id,
        stop_type,
        status,
        window_start,
        window_end,
        sort_order,
        dogs (
          name,
          breed,
          notes,
          customers ( owner_name, phone, email, address, address_lat, address_lng, notes )
        )
      )
    `
    )
    .eq("company_id", companyId)
    .eq("date", date)
    .maybeSingle();

  return hike;
}
