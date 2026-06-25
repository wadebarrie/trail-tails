import { getCurrentProfile } from "@/features/auth/queries";
import { canAccessAdmin, canAccessDriver } from "@/features/auth/access";
import { createClient } from "@/lib/supabase/server";
import { logErrorFromException, logWarn } from "@/lib/logger";
import { syncStopsForDate } from "@/features/hikes/sync-stops";

/** Ensure a hike exists for the date and stops are generated from schedules. */
export async function ensureHikeForDate(companyId: string, date: string) {
  const profile = await getCurrentProfile();
  if (
    !profile?.is_active ||
    profile.company_id !== companyId ||
    (!canAccessAdmin(profile) && !canAccessDriver(profile))
  ) {
    throw new Error("Unauthorized");
  }

  return syncStopsForDate(companyId, date);
}

export async function getHikeWithStops(companyId: string, date: string) {
  try {
    await ensureHikeForDate(companyId, date);
  } catch (error) {
    logErrorFromException("hike", "Failed to ensure hike for date", error, {
      companyId,
      context: { date },
    });
    return null;
  }

  const supabase = await createClient();

  const { data: hike, error } = await supabase
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

  if (error) {
    logWarn("hike", "Failed to load hike with stops", {
      companyId,
      context: { date, dbError: error.message },
    });
    return null;
  }

  return hike;
}
