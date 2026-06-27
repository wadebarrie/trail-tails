"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  syncStopsForDate,
  dateRangeInclusive,
  addDaysToDate,
} from "@/features/hikes/sync-stops";
import { requireRole } from "@/features/auth/queries";
import { parseScheduleDays } from "@/lib/dates";

const dogSchema = z.object({
  customer_id: z.string().uuid(),
  route_id: z.preprocess(
    (v) => (typeof v === "string" && v.length > 0 ? v : null),
    z.string().uuid().nullable()
  ),
  name: z.string().min(1, "Dog name is required"),
  breed: z.string().optional(),
  notes: z.string().optional(),
  pickup_window_start: z.string().min(1),
  pickup_window_end: z.string().min(1),
  is_active: z.coerce.boolean().optional(),
  schedule_days: z.string().optional(),
  hike_rate: z.string().optional(),
});

function parseHikeRateCents(raw?: string): number | null {
  if (!raw?.trim()) return null;
  const n = Number.parseFloat(raw.replace(/[$,\s]/g, ""));
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

export async function createDogAction(
  _prev: { error?: string },
  formData: FormData
) {
  const profile = await requireRole("admin");
  const parsed = dogSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();

  const sortOrder =
    parsed.data.route_id != null
      ? ((
          await supabase
            .from("dogs")
            .select("*", { count: "exact", head: true })
            .eq("route_id", parsed.data.route_id)
        ).count ?? 0)
      : 0;

  const { data: dog, error } = await supabase
    .from("dogs")
    .insert({
      company_id: profile.company_id,
      customer_id: parsed.data.customer_id,
      route_id: parsed.data.route_id,
      name: parsed.data.name,
      breed: parsed.data.breed || null,
      notes: parsed.data.notes || null,
      pickup_window_start: parsed.data.pickup_window_start,
      pickup_window_end: parsed.data.pickup_window_end,
      is_active: parsed.data.is_active ?? true,
      route_sort_order: sortOrder,
      hike_rate_cents: parseHikeRateCents(parsed.data.hike_rate),
    })
    .select("id")
    .single();

  if (error || !dog) return { error: error?.message ?? "Failed to create dog" };

  const days = parseScheduleDays(parsed.data.schedule_days);
  if (days.length > 0) {
    await supabase.from("dog_schedule_days").insert(
      days.map((day_of_week) => ({ dog_id: dog.id, day_of_week }))
    );
  }

  revalidatePath("/dashboard/dogs");
  redirect("/dashboard/dogs");
}

export async function updateDogAction(
  id: string,
  _prev: { error?: string },
  formData: FormData
) {
  await requireRole("admin");
  const parsed = dogSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("dogs")
    .update({
      customer_id: parsed.data.customer_id,
      route_id: parsed.data.route_id,
      name: parsed.data.name,
      breed: parsed.data.breed || null,
      notes: parsed.data.notes || null,
      pickup_window_start: parsed.data.pickup_window_start,
      pickup_window_end: parsed.data.pickup_window_end,
      is_active: parsed.data.is_active ?? true,
      hike_rate_cents: parseHikeRateCents(parsed.data.hike_rate),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("dog_schedule_days").delete().eq("dog_id", id);

  const days = parseScheduleDays(parsed.data.schedule_days);
  if (days.length > 0) {
    await supabase.from("dog_schedule_days").insert(
      days.map((day_of_week) => ({ dog_id: id, day_of_week }))
    );
  }

  revalidatePath("/dashboard/dogs");
  revalidatePath(`/dashboard/dogs/${id}`);
  redirect("/dashboard/dogs");
}

export async function createScheduleExceptionAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const profile = await requireRole("admin");
  const dogId = String(formData.get("dog_id") ?? "");
  const exceptionType = String(formData.get("exception_type") ?? "skip_date");
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "") || null;
  const reason = String(formData.get("reason") ?? "") || null;

  if (!dogId || !startDate) {
    return { error: "Dog and start date are required." };
  }

  const supabase = await createClient();

  const { data: dog } = await supabase
    .from("dogs")
    .select("id, name, company_id")
    .eq("id", dogId)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (!dog) {
    return { error: "Dog not found." };
  }

  const end =
    exceptionType === "pause"
      ? null
      : endDate ?? (exceptionType === "vacation" ? null : startDate);

  const { data: inserted, error } = await supabase
    .from("schedule_exceptions")
    .insert({
      dog_id: dogId,
      exception_type: exceptionType as "skip_date" | "vacation" | "pause",
      start_date: startDate,
      end_date: end,
      reason,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: error?.message ?? "Failed to add exception." };
  }

  const dates =
    end && end !== startDate
      ? dateRangeInclusive(startDate, end)
      : exceptionType === "pause"
        ? Array.from({ length: 14 }, (_, i) => addDaysToDate(startDate, i))
        : [startDate];

  for (const date of dates) {
    await syncStopsForDate(profile.company_id, date);
  }

  revalidatePath("/dashboard/exceptions");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  redirect(
    `/dashboard/exceptions?added=${inserted.id}&dog=${encodeURIComponent(dog.name)}`
  );
}
