"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformOwner } from "@/features/platform/queries";

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

const companyPlanSchema = z.object({
  company_id: z.string().uuid(),
  plan_tier: z.enum(["trial", "starter", "growth", "enterprise"]),
  status: z.enum(["active", "paused", "churned"]),
  monthly_subscription_cents: z.coerce.number().int().min(0),
  trial_ends_at: z.string().optional(),
});

export type UpdateCompanyPlanResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateCompanyPlanAction(
  _prev: UpdateCompanyPlanResult | { error?: string },
  formData: FormData
): Promise<UpdateCompanyPlanResult> {
  await requirePlatformOwner();
  const raw = Object.fromEntries(formData);
  const parsed = companyPlanSchema.safeParse({
    ...raw,
    trial_ends_at: raw.trial_ends_at || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("companies")
    .update({
      plan_tier: parsed.data.plan_tier,
      status: parsed.data.status,
      monthly_subscription_cents: parsed.data.monthly_subscription_cents,
      trial_ends_at: parsed.data.trial_ends_at || null,
    })
    .eq("id", parsed.data.company_id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/owner");
  revalidatePath(`/owner/companies/${parsed.data.company_id}`);
  return { ok: true };
}
