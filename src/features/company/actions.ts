"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/features/auth/queries";
import { COMMON_TIMEZONES } from "@/features/platform/timezones";
import { digitsOnly } from "@/lib/phone";

const baseSettingsSchema = z.object({
  company_name: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(80, "Company name is too long"),
  timezone: z.string().min(1, "Timezone is required"),
  route_cadence: z.enum(["once", "twice"]),
  default_hike_rate: z.string().optional(),
  night_before_reminder_time: z.string().min(1, "Reminder time is required"),
  auto_send_gallery_on_closeout: z.enum(["true", "false"]).optional(),
  sms_mode: z.enum(["test", "live"]).optional(),
  sms_test_phone: z.string().optional(),
  sms_customer_consent: z.enum(["yes"]).optional(),
});

function parseRateToCents(raw?: string): number | null {
  if (!raw?.trim()) return null;
  const n = Number.parseFloat(raw.replace(/[$,\s]/g, ""));
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

export async function updateCompanySettingsAction(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const profile = await requireRole("admin");
  const parsed = baseSettingsSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const rateCents = parseRateToCents(parsed.data.default_hike_rate);
  if (parsed.data.default_hike_rate?.trim() && rateCents == null) {
    return { error: "Enter a valid hike price (e.g. 60.00)" };
  }

  const supabase = await createClient();
  const [{ data: existing }, smsRow] = await Promise.all([
    supabase
      .from("companies")
      .select("timezone")
      .eq("id", profile.company_id)
      .maybeSingle(),
    supabase
      .from("companies")
      .select("sms_mode, sms_live_approved")
      .eq("id", profile.company_id)
      .maybeSingle(),
  ]);

  const allowedTimezones = new Set<string>(
    COMMON_TIMEZONES.map((tz) => tz.value)
  );
  if (existing?.timezone) allowedTimezones.add(existing.timezone);

  if (!allowedTimezones.has(parsed.data.timezone)) {
    return { error: "Choose a timezone from the list" };
  }

  const smsMode = parsed.data.sms_mode;
  const saveSms = Boolean(smsMode) && !smsRow.error;
  const testPhone = parsed.data.sms_test_phone?.trim() || null;
  if (saveSms && smsMode === "test" && (!testPhone || digitsOnly(testPhone).length < 10)) {
    return { error: "Enter the mobile number that should receive test texts." };
  }
  if (
    saveSms &&
    smsMode === "live" &&
    smsRow.data?.sms_mode !== "live" &&
    parsed.data.sms_customer_consent !== "yes"
  ) {
    return {
      error: "Confirm that customers have agreed to receive texts before going live.",
    };
  }
  if (saveSms && smsMode === "live" && smsRow.data?.sms_live_approved === false) {
    return {
      error:
        "Live texts stay off until PackRoute approves this company. Keep test mode for now.",
    };
  }

  const { error } = await supabase
    .from("companies")
    .update({
      name: parsed.data.company_name,
      timezone: parsed.data.timezone,
      route_cadence: parsed.data.route_cadence,
      default_hike_rate_cents: rateCents,
      night_before_reminder_time: parsed.data.night_before_reminder_time,
      auto_send_gallery_on_closeout:
        parsed.data.auto_send_gallery_on_closeout !== "false",
      ...(saveSms
        ? { sms_mode: smsMode, sms_test_phone: testPhone }
        : {}),
    })
    .eq("id", profile.company_id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/route");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  revalidatePath("/dashboard/onboarding");
  revalidatePath("/today");
  revalidatePath("/tomorrow");

  return { ok: true };
}
