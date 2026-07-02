"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  datesAffectedByException,
  resolveExceptionEndDate,
  scheduleExceptionStopSync,
} from "@/features/dogs/exception-sync.server";
import { syncStopsForTodayAndTomorrow } from "@/features/hikes/sync-stops";
import { requireRole } from "@/features/auth/queries";
import { parseScheduleDays } from "@/lib/dates";
import { optionalUuidLike, uuidLike } from "@/lib/validation";
import { one } from "@/lib/supabase/relations";
import type { DogScheduleType, ExceptionType } from "@/types";

const dogSchema = z.object({
  customer_id: uuidLike,
  route_id: optionalUuidLike,
  schedule_type: z.enum(["recurring", "as_needed"]).default("recurring"),
  name: z.string().min(1, "Dog name is required"),
  breed: z.string().optional(),
  notes: z.string().optional(),
  pickup_window_start: z.string().min(1),
  pickup_window_end: z.string().min(1),
  use_dropoff_window: z.string().optional(),
  dropoff_window_start: z.string().optional(),
  dropoff_window_end: z.string().optional(),
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

function parseDropoffWindow(data: {
  use_dropoff_window?: string;
  dropoff_window_start?: string;
  dropoff_window_end?: string;
}): { start: string | null; end: string | null } | { error: string } {
  if (data.use_dropoff_window !== "true") {
    return { start: null, end: null };
  }

  const start = data.dropoff_window_start?.trim();
  const end = data.dropoff_window_end?.trim();

  if (!start || !end) {
    return { error: "Drop-off window requires both start and end times." };
  }

  return { start, end };
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

  const dropoffWindow = parseDropoffWindow(parsed.data);
  if ("error" in dropoffWindow) {
    return { error: dropoffWindow.error };
  }

  const supabase = await createClient();
  const isAsNeeded = parsed.data.schedule_type === "as_needed";
  const routeId = isAsNeeded ? null : parsed.data.route_id;

  const sortOrder =
    routeId != null
      ? ((
          await supabase
            .from("dogs")
            .select("*", { count: "exact", head: true })
            .eq("route_id", routeId)
        ).count ?? 0)
      : 0;

  const { data: dog, error } = await supabase
    .from("dogs")
    .insert({
      company_id: profile.company_id,
      customer_id: parsed.data.customer_id,
      route_id: routeId,
      schedule_type: parsed.data.schedule_type as DogScheduleType,
      name: parsed.data.name,
      breed: parsed.data.breed || null,
      notes: parsed.data.notes || null,
      pickup_window_start: parsed.data.pickup_window_start,
      pickup_window_end: parsed.data.pickup_window_end,
      dropoff_window_start: dropoffWindow.start,
      dropoff_window_end: dropoffWindow.end,
      is_active: parsed.data.is_active ?? true,
      route_sort_order: sortOrder,
      hike_rate_cents: parseHikeRateCents(parsed.data.hike_rate),
    })
    .select("id")
    .single();

  if (error || !dog) return { error: error?.message ?? "Failed to create dog" };

  if (!isAsNeeded) {
    const days = parseScheduleDays(parsed.data.schedule_days);
    if (days.length > 0) {
      await supabase.from("dog_schedule_days").insert(
        days.map((day_of_week) => ({ dog_id: dog.id, day_of_week }))
      );
    }
  }

  if (routeId && parsed.data.is_active !== false) {
    await syncStopsForTodayAndTomorrow(profile.company_id);
    revalidatePath("/dashboard/hikes/today");
    revalidatePath("/dashboard/hikes/tomorrow");
    revalidatePath("/today");
    revalidatePath("/tomorrow");
  }

  revalidatePath("/dashboard/dogs");
  redirect("/dashboard/dogs");
}

export async function updateDogAction(
  id: string,
  _prev: { error?: string },
  formData: FormData
) {
  const profile = await requireRole("admin");
  const parsed = dogSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const dropoffWindow = parseDropoffWindow(parsed.data);
  if ("error" in dropoffWindow) {
    return { error: dropoffWindow.error };
  }

  const supabase = await createClient();
  const isAsNeeded = parsed.data.schedule_type === "as_needed";
  const routeId = isAsNeeded ? null : parsed.data.route_id;

  const { data: existing } = await supabase
    .from("dogs")
    .select("route_id")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  const { error } = await supabase
    .from("dogs")
    .update({
      customer_id: parsed.data.customer_id,
      route_id: routeId,
      schedule_type: parsed.data.schedule_type as DogScheduleType,
      name: parsed.data.name,
      breed: parsed.data.breed || null,
      notes: parsed.data.notes || null,
      pickup_window_start: parsed.data.pickup_window_start,
      pickup_window_end: parsed.data.pickup_window_end,
      dropoff_window_start: dropoffWindow.start,
      dropoff_window_end: dropoffWindow.end,
      is_active: parsed.data.is_active ?? true,
      hike_rate_cents: parseHikeRateCents(parsed.data.hike_rate),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("dog_schedule_days").delete().eq("dog_id", id);

  if (!isAsNeeded) {
    const days = parseScheduleDays(parsed.data.schedule_days);
    if (days.length > 0) {
      await supabase.from("dog_schedule_days").insert(
        days.map((day_of_week) => ({ dog_id: id, day_of_week }))
      );
    }
  }

  const routesToSync = new Set<string>();
  if (existing?.route_id) routesToSync.add(existing.route_id);
  if (routeId) routesToSync.add(routeId);

  if (routesToSync.size > 0 || isAsNeeded) {
    await syncStopsForTodayAndTomorrow(profile.company_id);
    revalidatePath("/dashboard/hikes/today");
    revalidatePath("/dashboard/hikes/tomorrow");
    revalidatePath("/today");
    revalidatePath("/tomorrow");
  }

  revalidatePath("/dashboard/dogs");
  revalidatePath(`/dashboard/dogs/${id}`);
  redirect("/dashboard/dogs");
}

type ExceptionFormInput = {
  dogId: string;
  exceptionType: ExceptionType;
  startDate: string;
  endDate: string | null;
  reason: string | null;
};

function parseExceptionForm(formData: FormData): ExceptionFormInput | { error: string } {
  const dogId = String(formData.get("dog_id") ?? "");
  const exceptionType = String(formData.get("exception_type") ?? "skip_date") as ExceptionType;
  const startDate = String(formData.get("start_date") ?? "");
  const endDateRaw = String(formData.get("end_date") ?? "") || null;
  const reason = String(formData.get("reason") ?? "") || null;

  if (!dogId || !startDate) {
    return { error: "Dog and start date are required." };
  }

  if (!["skip_date", "vacation", "pause"].includes(exceptionType)) {
    return { error: "Invalid exception type." };
  }

  return {
    dogId,
    exceptionType,
    startDate,
    endDate: endDateRaw,
    reason,
  };
}

async function verifyCompanyDog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dogId: string,
  companyId: string
) {
  const { data: dog } = await supabase
    .from("dogs")
    .select("id, name, company_id")
    .eq("id", dogId)
    .eq("company_id", companyId)
    .maybeSingle();

  return dog;
}

async function getCompanyException(
  supabase: Awaited<ReturnType<typeof createClient>>,
  exceptionId: string,
  companyId: string
) {
  const { data } = await supabase
    .from("schedule_exceptions")
    .select(
      `
      id,
      dog_id,
      exception_type,
      start_date,
      end_date,
      reason,
      dogs!inner ( company_id, name )
    `
    )
    .eq("id", exceptionId)
    .maybeSingle();

  if (!data) return null;

  const dog = one(
    data.dogs as
      | { company_id: string; name: string }
      | { company_id: string; name: string }[]
  );
  if (!dog || dog.company_id !== companyId) return null;

  return data;
}

function revalidateExceptionPaths() {
  revalidatePath("/dashboard/exceptions");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
}

export async function createScheduleExceptionAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const profile = await requireRole("admin");
  const parsed = parseExceptionForm(formData);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const supabase = await createClient();
  const dog = await verifyCompanyDog(supabase, parsed.dogId, profile.company_id);

  if (!dog) {
    return { error: "Dog not found." };
  }

  const end = resolveExceptionEndDate(
    parsed.exceptionType,
    parsed.startDate,
    parsed.endDate
  );

  const { data: inserted, error } = await supabase
    .from("schedule_exceptions")
    .insert({
      dog_id: parsed.dogId,
      exception_type: parsed.exceptionType,
      start_date: parsed.startDate,
      end_date: end,
      reason: parsed.reason,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: error?.message ?? "Failed to add exception." };
  }

  scheduleExceptionStopSync(
    profile.company_id,
    [parsed.dogId],
    datesAffectedByException(parsed.exceptionType, parsed.startDate, end)
  );

  revalidateExceptionPaths();
  redirect(
    `/dashboard/exceptions?added=${inserted.id}&dog=${encodeURIComponent(dog.name)}`
  );
}

export async function updateScheduleExceptionAction(
  exceptionId: string,
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const profile = await requireRole("admin");
  const parsed = parseExceptionForm(formData);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const supabase = await createClient();
  const existing = await getCompanyException(
    supabase,
    exceptionId,
    profile.company_id
  );

  if (!existing) {
    return { error: "Exception not found." };
  }

  const dog = await verifyCompanyDog(supabase, parsed.dogId, profile.company_id);

  if (!dog) {
    return { error: "Dog not found." };
  }

  const end = resolveExceptionEndDate(
    parsed.exceptionType,
    parsed.startDate,
    parsed.endDate
  );

  const { error } = await supabase
    .from("schedule_exceptions")
    .update({
      dog_id: parsed.dogId,
      exception_type: parsed.exceptionType,
      start_date: parsed.startDate,
      end_date: end,
      reason: parsed.reason,
    })
    .eq("id", exceptionId);

  if (error) {
    return { error: error.message };
  }

  const datesToSync = [
    ...datesAffectedByException(
      existing.exception_type as ExceptionType,
      existing.start_date,
      existing.end_date
    ),
    ...datesAffectedByException(parsed.exceptionType, parsed.startDate, end),
  ];

  scheduleExceptionStopSync(profile.company_id, [existing.dog_id, parsed.dogId], datesToSync);

  revalidateExceptionPaths();
  redirect(`/dashboard/exceptions?updated=${exceptionId}`);
}

export async function deleteScheduleExceptionAction(
  exceptionId: string
): Promise<{ error?: string }> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const existing = await getCompanyException(
    supabase,
    exceptionId,
    profile.company_id
  );

  if (!existing) {
    return { error: "Exception not found." };
  }

  const datesToSync = datesAffectedByException(
    existing.exception_type as ExceptionType,
    existing.start_date,
    existing.end_date
  );

  const { error } = await supabase
    .from("schedule_exceptions")
    .delete()
    .eq("id", exceptionId);

  if (error) {
    return { error: error.message };
  }

  scheduleExceptionStopSync(profile.company_id, [existing.dog_id], datesToSync);
  revalidateExceptionPaths();

  return {};
}
