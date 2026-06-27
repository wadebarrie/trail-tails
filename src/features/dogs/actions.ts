"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  datesAffectedByException,
  resolveExceptionEndDate,
  syncStopsForExceptionDates,
} from "@/features/dogs/exception-sync";
import { requireRole } from "@/features/auth/queries";
import { parseScheduleDays } from "@/lib/dates";
import { one } from "@/lib/supabase/relations";
import type { ExceptionType } from "@/types";

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

  await syncStopsForExceptionDates(
    profile.company_id,
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

  await syncStopsForExceptionDates(profile.company_id, datesToSync);

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

  await syncStopsForExceptionDates(profile.company_id, datesToSync);
  revalidateExceptionPaths();

  return {};
}
