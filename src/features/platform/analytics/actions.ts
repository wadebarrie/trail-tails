"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformOwner } from "@/features/platform/queries";
import { subscriptionUpdateSchema } from "@/features/subscription/schema";

const ASSUMPTIONS_ID = "b0000000-0000-0000-0000-000000000001";

const costAssumptionsSchema = z.object({
  sms_outbound_usd: z.coerce.number().min(0),
  sms_inbound_usd: z.coerce.number().min(0),
  eta_calculation_usd: z.coerce.number().min(0),
  geocode_usd: z.coerce.number().min(0),
  base_infra_per_company_usd: z.coerce.number().min(0),
  supabase_platform_usd: z.coerce.number().min(0),
  netlify_platform_usd: z.coerce.number().min(0),
});

export type UpdateCostAssumptionsResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateCostAssumptionsAction(
  _prev: UpdateCostAssumptionsResult | { error?: string },
  formData: FormData
): Promise<UpdateCostAssumptionsResult> {
  await requirePlatformOwner();
  const parsed = costAssumptionsSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("platform_cost_assumptions")
    .upsert({
      id: ASSUMPTIONS_ID,
      ...parsed.data,
      updated_at: new Date().toISOString(),
    });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/owner");
  revalidatePath("/owner/settings");
  revalidatePath("/owner/companies", "layout");
  return { ok: true };
}

export type UpdateCompanyPlanResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateCompanyPlanAction(
  _prev: UpdateCompanyPlanResult | { error?: string },
  formData: FormData
): Promise<UpdateCompanyPlanResult> {
  await requirePlatformOwner();
  const raw = Object.fromEntries(formData);
  const parsed = subscriptionUpdateSchema.safeParse({
    ...raw,
    trial_ends_at: raw.trial_ends_at || undefined,
    notes: raw.notes || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const trialEndsAt = parsed.data.trial_ends_at
    ? new Date(`${parsed.data.trial_ends_at}T23:59:59.999Z`).toISOString()
    : null;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({
      plan: parsed.data.plan,
      status: parsed.data.status,
      monthly_price: parsed.data.monthly_price,
      billing_currency: parsed.data.billing_currency,
      billing_interval: parsed.data.billing_interval,
      grandfathered: parsed.data.grandfathered ?? false,
      trial_ends_at: trialEndsAt,
      notes: parsed.data.notes?.trim() || null,
      cancelled_at:
        parsed.data.status === "cancelled" ? new Date().toISOString() : null,
    })
    .eq("company_id", parsed.data.company_id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/owner");
  revalidatePath(`/owner/companies/${parsed.data.company_id}`);
  return { ok: true };
}
