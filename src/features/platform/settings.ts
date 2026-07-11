import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformOwner } from "@/features/platform/queries";

export const PLATFORM_SETTINGS_ID = "c0000000-0000-0000-0000-000000000001";

export type PlatformSettings = {
  id: string;
  invites_enabled: boolean;
  updated_at: string;
};

const DEFAULT_SETTINGS: Omit<PlatformSettings, "id" | "updated_at"> = {
  invites_enabled: true,
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  await requirePlatformOwner();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("platform_settings")
    .select("id, invites_enabled, updated_at")
    .eq("id", PLATFORM_SETTINGS_ID)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    return {
      id: PLATFORM_SETTINGS_ID,
      ...DEFAULT_SETTINGS,
      updated_at: new Date().toISOString(),
    };
  }

  return {
    id: data.id,
    invites_enabled: data.invites_enabled,
    updated_at: data.updated_at,
  };
}

/** Used by signup and invite actions — defaults to enabled if unset. */
export async function areInvitesEnabled(): Promise<boolean> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("platform_settings")
    .select("invites_enabled")
    .eq("id", PLATFORM_SETTINGS_ID)
    .maybeSingle();

  if (error || !data) return DEFAULT_SETTINGS.invites_enabled;
  return data.invites_enabled;
}
