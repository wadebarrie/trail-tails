import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Profile } from "@/types";
import { AUTH_ROUTES } from "@/features/auth/constants";
import { requireProfile } from "@/features/auth/queries";

export async function requirePlatformOwner(): Promise<Profile> {
  const profile = await requireProfile();

  if (!profile.is_platform_owner) {
    redirect(AUTH_ROUTES.adminHome);
  }

  return profile;
}

export async function listCompaniesForOwner() {
  await requirePlatformOwner();
  const supabase = createServiceClient();

  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, name, timezone, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return companies ?? [];
}

export async function listInvitesForOwner() {
  await requirePlatformOwner();
  const supabase = createServiceClient();

  const { data: invites, error } = await supabase
    .from("company_invites")
    .select(
      `
      id,
      email,
      full_name,
      role,
      expires_at,
      accepted_at,
      created_at,
      companies ( name )
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return invites ?? [];
}

export type InvitePreview = {
  email: string;
  fullName: string | null;
  companyName: string;
  expired: boolean;
  used: boolean;
};

export async function getInvitePreviewByToken(
  token: string
): Promise<InvitePreview | null> {
  const { hashInviteToken } = await import("@/features/platform/invite-tokens");
  const supabase = createServiceClient();

  const { data: invite, error } = await supabase
    .from("company_invites")
    .select(
      `
      email,
      full_name,
      expires_at,
      accepted_at,
      companies ( name )
    `
    )
    .eq("token_hash", hashInviteToken(token))
    .maybeSingle();

  if (error || !invite) return null;

  const company = invite.companies as { name: string } | { name: string }[] | null;
  const companyName = Array.isArray(company) ? company[0]?.name : company?.name;

  if (!companyName) return null;

  return {
    email: invite.email,
    fullName: invite.full_name,
    companyName,
    expired: new Date(invite.expires_at) < new Date(),
    used: invite.accepted_at != null,
  };
}
