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
  minutes_per_eta_notification: z.coerce.number().min(0),
  minutes_per_sms_request: z.coerce.number().min(0),
  minutes_per_route_created: z.coerce.number().min(0),
  minutes_per_billing_export: z.coerce.number().min(0),
});

const founderProfileSchema = z.object({
  company_id: z.string().uuid(),
  internal_notes: z.string().optional(),
  follow_up_date: z.string().optional(),
  case_study_status: z.enum(["none", "candidate", "in_progress", "published"]),
  customer_quote: z.string().optional(),
});

const operationalReviewSchema = z.object({
  company_id: z.string().uuid(),
  review_month: z.string().regex(/^\d{4}-\d{2}$/),
  summary: z.string().optional(),
  value_delivered: z.string().optional(),
  operational_highlights: z.string().optional(),
  issues: z.string().optional(),
  feature_requests: z.string().optional(),
  case_study_readiness: z.string().optional(),
  customer_quote: z.string().optional(),
  internal_notes: z.string().optional(),
  status: z.enum(["draft", "reviewed", "sent"]),
  metrics_json: z.string(),
  company_name: z.string(),
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
  revalidatePath("/owner/reviews");
  return { ok: true };
}

export type UpdateFounderProfileResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateFounderProfileAction(
  _prev: UpdateFounderProfileResult | { error?: string },
  formData: FormData
): Promise<UpdateFounderProfileResult> {
  await requirePlatformOwner();
  const raw = Object.fromEntries(formData);
  const parsed = founderProfileSchema.safeParse({
    ...raw,
    internal_notes: raw.internal_notes || undefined,
    follow_up_date: raw.follow_up_date || undefined,
    customer_quote: raw.customer_quote || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("company_founder_profiles").upsert(
    {
      company_id: parsed.data.company_id,
      internal_notes: parsed.data.internal_notes?.trim() || null,
      follow_up_date: parsed.data.follow_up_date || null,
      case_study_status: parsed.data.case_study_status,
      customer_quote: parsed.data.customer_quote?.trim() || null,
    },
    { onConflict: "company_id" }
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/owner");
  revalidatePath(`/owner/companies/${parsed.data.company_id}`);
  return { ok: true };
}

export type SaveOperationalReviewResult =
  | { ok: true; reviewId: string }
  | { ok: false; error: string };

export async function saveOperationalReviewAction(
  _prev: SaveOperationalReviewResult | { error?: string },
  formData: FormData
): Promise<SaveOperationalReviewResult> {
  await requirePlatformOwner();
  const raw = Object.fromEntries(formData);
  const parsed = operationalReviewSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  let metrics: Record<string, unknown>;
  try {
    metrics = JSON.parse(parsed.data.metrics_json) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "Invalid metrics payload." };
  }

  const now = new Date().toISOString();
  const payload = {
    company_id: parsed.data.company_id,
    review_month: `${parsed.data.review_month}-01`,
    metrics,
    summary: parsed.data.summary?.trim() || null,
    value_delivered: parsed.data.value_delivered?.trim() || null,
    operational_highlights: parsed.data.operational_highlights?.trim() || null,
    issues: parsed.data.issues?.trim() || null,
    feature_requests: parsed.data.feature_requests?.trim() || null,
    case_study_readiness: parsed.data.case_study_readiness?.trim() || null,
    customer_quote: parsed.data.customer_quote?.trim() || null,
    internal_notes: parsed.data.internal_notes?.trim() || null,
    status: parsed.data.status,
    reviewed_at: parsed.data.status === "reviewed" || parsed.data.status === "sent" ? now : null,
    sent_at: parsed.data.status === "sent" ? now : null,
  };

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("operational_reviews")
    .upsert(payload, { onConflict: "company_id,review_month" })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Save failed." };

  revalidatePath("/owner/reviews");
  revalidatePath(`/owner/companies/${parsed.data.company_id}`);
  revalidatePath(`/owner/reviews/${parsed.data.company_id}/${parsed.data.review_month}`);
  return { ok: true, reviewId: data.id as string };
}
