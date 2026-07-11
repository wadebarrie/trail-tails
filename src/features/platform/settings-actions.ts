"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { PLATFORM_SETTINGS_ID } from "@/features/platform/settings";
import { requirePlatformOwner } from "@/features/platform/queries";

const platformSettingsSchema = z.object({
  invites_enabled: z
    .enum(["on", "off"])
    .transform((value) => value === "on"),
});

export type UpdatePlatformSettingsResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updatePlatformSettingsAction(
  _prev: UpdatePlatformSettingsResult | { error?: string },
  formData: FormData,
): Promise<UpdatePlatformSettingsResult> {
  await requirePlatformOwner();

  const parsed = platformSettingsSchema.safeParse({
    invites_enabled: formData.get("invites_enabled") ?? "off",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("platform_settings").upsert({
    id: PLATFORM_SETTINGS_ID,
    invites_enabled: parsed.data.invites_enabled,
    updated_at: new Date().toISOString(),
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/owner/settings");
  revalidatePath("/owner/provision");
  revalidatePath("/signup");
  return { ok: true };
}
