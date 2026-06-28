"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import {
  buildInviteUrl,
  generateInviteToken,
  hashInviteToken,
} from "@/features/platform/invite-tokens";
import { requirePlatformOwner } from "@/features/platform/queries";
import { passwordSchema } from "@/lib/password";

const createCompanyInviteSchema = z.object({
  company_name: z.string().min(1, "Company name is required."),
  timezone: z.string().min(1, "Timezone is required."),
  admin_email: z.string().email("Valid admin email is required."),
  admin_full_name: z.string().min(1, "Admin name is required."),
});

export type CreateCompanyInviteResult =
  | { ok: true; inviteUrl: string; companyId: string }
  | { ok: false; error: string };

export async function createCompanyInviteAction(
  _prev: CreateCompanyInviteResult | { error?: string },
  formData: FormData
): Promise<CreateCompanyInviteResult> {
  const owner = await requirePlatformOwner();
  const parsed = createCompanyInviteSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = createServiceClient();
  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const adminEmail = parsed.data.admin_email.trim().toLowerCase();

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      name: parsed.data.company_name.trim(),
      timezone: parsed.data.timezone,
      plan_tier: "trial",
      status: "active",
      monthly_subscription_cents: 0,
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("id")
    .single();

  if (companyError || !company) {
    return { ok: false, error: companyError?.message ?? "Failed to create company." };
  }

  const { error: inviteError } = await supabase.from("company_invites").insert({
    company_id: company.id,
    email: adminEmail,
    token_hash: tokenHash,
    role: "admin",
    full_name: parsed.data.admin_full_name.trim(),
    expires_at: expiresAt,
    created_by: owner.id,
  });

  if (inviteError) {
    await supabase.from("companies").delete().eq("id", company.id);
    return { ok: false, error: inviteError.message };
  }

  revalidatePath("/owner");
  return {
    ok: true,
    inviteUrl: buildInviteUrl(token),
    companyId: company.id,
  };
}

const acceptInviteSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    password_confirm: z.string().min(1),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwords do not match.",
    path: ["password_confirm"],
  });

export type AcceptInviteResult =
  | { ok: true }
  | { ok: false; error: string };

export async function acceptInviteAction(
  _prev: AcceptInviteResult | { error?: string },
  formData: FormData
): Promise<AcceptInviteResult> {
  const parsed = acceptInviteSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = createServiceClient();
  const tokenHash = hashInviteToken(parsed.data.token);

  const { data: invite, error: inviteError } = await supabase
    .from("company_invites")
    .select("id, company_id, email, full_name, role, expires_at, accepted_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (inviteError || !invite) {
    return { ok: false, error: "This invite link is invalid." };
  }

  if (invite.accepted_at) {
    return { ok: false, error: "This invite has already been used." };
  }

  if (new Date(invite.expires_at) < new Date()) {
    return { ok: false, error: "This invite has expired. Ask for a new one." };
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: invite.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      company_id: invite.company_id,
      role: invite.role,
      full_name: invite.full_name ?? invite.email.split("@")[0],
    },
  });

  if (authError || !authData.user) {
    if (authError?.message?.toLowerCase().includes("already")) {
      return {
        ok: false,
        error: "An account with this email already exists. Try signing in instead.",
      };
    }
    return { ok: false, error: authError?.message ?? "Failed to create account." };
  }

  const { error: updateError } = await supabase
    .from("company_invites")
    .update({
      accepted_at: new Date().toISOString(),
      accepted_by: authData.user.id,
    })
    .eq("id", invite.id)
    .is("accepted_at", null);

  if (updateError) {
    return { ok: false, error: "Account created but invite could not be marked used." };
  }

  return { ok: true };
}
