"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/features/auth/queries";

const settingsSchema = z.object({
  default_hike_rate: z.string().optional(),
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
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const rateCents = parseRateToCents(parsed.data.default_hike_rate);
  if (parsed.data.default_hike_rate?.trim() && rateCents == null) {
    return { error: "Enter a valid hike price (e.g. 60.00)" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({ default_hike_rate_cents: rateCents })
    .eq("id", profile.company_id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/billing");

  return { ok: true };
}
