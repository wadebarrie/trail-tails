import { createServiceClient } from "@/lib/supabase/service";

export type ProductEventName =
  | "signup_started"
  | "signup_completed"
  | "onboarding_step"
  | "first_text_sent"
  | "first_photo"
  | "first_invoice";

/** Best-effort product event. Never throws, and never blocks signup or setup. */
export async function recordProductEvent(input: {
  name: ProductEventName;
  companyId?: string | null;
  once?: boolean;
  context?: Record<string, string>;
}): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const supabase = createServiceClient();
    if (input.once && input.companyId) {
      const { count } = await supabase
        .from("system_logs")
        .select("id", { count: "exact", head: true })
        .eq("company_id", input.companyId)
        .eq("message", input.name);
      if ((count ?? 0) > 0) return;
    }
    await supabase.from("system_logs").insert({
      company_id: input.companyId ?? null,
      level: "info",
      category: "system",
      message: input.name,
      context: input.context ?? {},
    });
  } catch {
    // Analytics must not break signup or the wizard.
  }
}
