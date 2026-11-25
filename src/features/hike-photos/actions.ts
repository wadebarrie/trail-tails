"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireDriverAccess, requireRole } from "@/features/auth/queries";
import {
  HIKE_PHOTOS_BUCKET,
  PHOTO_CAPTION_MAX_LENGTH,
  PHOTO_MAX_DOG_TAGS,
  isUuid,
} from "@/features/hike-photos/constants";
import { generateShareToken } from "@/features/hike-photos/share";
import { logErrorFromException } from "@/lib/logger";

export type HikePhotoActionResult =
  | { ok: true; photoId?: string }
  | { ok: false; error: string };

function revalidatePhotoPaths() {
  revalidatePath("/dashboard/photos");
}

/**
 * Driver: record a photo the browser already uploaded to Storage, tag dogs,
 * and make sure each tagged dog's owner has a gallery link for this hike.
 */
export async function recordHikePhotoAction(input: {
  hikeId: string;
  storagePath: string;
  caption?: string | null;
  dogIds: string[];
}): Promise<HikePhotoActionResult> {
  const profile = await requireDriverAccess();

  const { hikeId, storagePath } = input;
  const dogIds = [...new Set(input.dogIds)];
  const caption = input.caption?.trim().slice(0, PHOTO_CAPTION_MAX_LENGTH) || null;

  if (!isUuid(hikeId) || dogIds.some((id) => !isUuid(id))) {
    return { ok: false, error: "Invalid photo details." };
  }
  if (dogIds.length > PHOTO_MAX_DOG_TAGS) {
    return { ok: false, error: "Too many dogs tagged on one photo." };
  }

  const expectedPrefix = `${profile.company_id}/${hikeId}/`;
  if (
    !storagePath.startsWith(expectedPrefix) ||
    !/^[0-9a-f-]{36}\.jpg$/i.test(storagePath.slice(expectedPrefix.length))
  ) {
    return { ok: false, error: "Invalid photo path." };
  }

  const supabase = await createClient();

  const { data: hike } = await supabase
    .from("hikes")
    .select("id, company_id")
    .eq("id", hikeId)
    .maybeSingle();

  if (!hike || hike.company_id !== profile.company_id) {
    return { ok: false, error: "Hike not found." };
  }

  if (dogIds.length) {
    const { data: stops } = await supabase
      .from("stops")
      .select("dog_id")
      .eq("hike_id", hikeId)
      .in("dog_id", dogIds);
    const onHike = new Set((stops ?? []).map((s) => s.dog_id as string));
    if (dogIds.some((id) => !onHike.has(id))) {
      return { ok: false, error: "Tagged dog isn't on this hike." };
    }
  }

  const { data: photo, error: photoError } = await supabase
    .from("hike_photos")
    .insert({
      company_id: profile.company_id,
      hike_id: hikeId,
      uploaded_by: profile.id,
      storage_path: storagePath,
      caption,
    })
    .select("id")
    .single();

  if (photoError || !photo) {
    return { ok: false, error: "Could not save the photo. Try again." };
  }

  if (dogIds.length) {
    const { error: tagError } = await supabase
      .from("hike_photo_dogs")
      .insert(dogIds.map((dog_id) => ({ photo_id: photo.id, dog_id })));

    if (tagError) {
      await supabase.from("hike_photos").delete().eq("id", photo.id);
      return { ok: false, error: "Could not tag dogs on the photo." };
    }

    try {
      await ensureSharesForDogs(profile.company_id, hikeId, dogIds);
    } catch (error) {
      // Photo is saved; sharing can be retried by the next upload.
      logErrorFromException("hike", "Hike photo share creation failed", error, {
        companyId: profile.company_id,
        context: { hikeId, photoId: photo.id },
      });
    }
  }

  revalidatePhotoPaths();
  return { ok: true, photoId: photo.id as string };
}

async function ensureSharesForDogs(
  companyId: string,
  hikeId: string,
  dogIds: string[]
) {
  const service = createServiceClient();
  const { data: dogs, error } = await service
    .from("dogs")
    .select("customer_id")
    .eq("company_id", companyId)
    .in("id", dogIds);
  if (error) throw new Error(error.message);

  const customerIds = [
    ...new Set((dogs ?? []).map((d) => d.customer_id as string)),
  ];
  if (!customerIds.length) return;

  const { error: upsertError } = await service.from("hike_photo_shares").upsert(
    customerIds.map((customer_id) => ({
      company_id: companyId,
      hike_id: hikeId,
      customer_id,
      token: generateShareToken(),
    })),
    { onConflict: "hike_id,customer_id", ignoreDuplicates: true }
  );
  if (upsertError) throw new Error(upsertError.message);
}

/** Driver: discard an upload when the DB record failed (best effort). */
export async function discardUploadedPhotoAction(
  storagePath: string
): Promise<void> {
  const profile = await requireDriverAccess();
  if (!storagePath.startsWith(`${profile.company_id}/`)) return;

  const service = createServiceClient();
  const { data: existing } = await service
    .from("hike_photos")
    .select("id")
    .eq("storage_path", storagePath)
    .maybeSingle();
  if (existing) return;

  await service.storage.from(HIKE_PHOTOS_BUCKET).remove([storagePath]);
}

/** Admin: delete a photo (Storage object + DB row; tags cascade). */
export async function deleteHikePhotoAction(
  photoId: string
): Promise<HikePhotoActionResult> {
  const profile = await requireRole("admin");

  if (!isUuid(photoId)) return { ok: false, error: "Photo not found." };

  const supabase = await createClient();
  const { data: photo } = await supabase
    .from("hike_photos")
    .select("id, storage_path")
    .eq("id", photoId)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (!photo) return { ok: false, error: "Photo not found." };

  const service = createServiceClient();
  const { error: storageError } = await service.storage
    .from(HIKE_PHOTOS_BUCKET)
    .remove([photo.storage_path as string]);
  if (storageError) {
    return { ok: false, error: "Could not delete the photo file." };
  }

  const { error } = await supabase
    .from("hike_photos")
    .delete()
    .eq("id", photoId)
    .eq("company_id", profile.company_id);
  if (error) return { ok: false, error: "Could not delete the photo." };

  revalidatePhotoPaths();
  return { ok: true };
}

/** Admin: stop an owner's gallery link from working. */
export async function revokeHikePhotoShareAction(
  shareId: string
): Promise<HikePhotoActionResult> {
  const profile = await requireRole("admin");
  if (!isUuid(shareId)) return { ok: false, error: "Link not found." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("hike_photo_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", shareId)
    .eq("company_id", profile.company_id);
  if (error) return { ok: false, error: "Could not revoke the link." };

  revalidatePhotoPaths();
  return { ok: true };
}

export type SendGalleriesResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/** Admin: manually text gallery links for every hike on a company local date. */
export async function sendTodaysGalleriesAction(
  date: string
): Promise<SendGalleriesResult> {
  const profile = await requireRole("admin");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: "Choose a valid date." };
  }

  const { sendGallerySmsForCompanyDate } = await import(
    "@/features/hike-photos/send-gallery-sms"
  );
  const result = await sendGallerySmsForCompanyDate(profile.company_id, date);

  revalidatePath("/dashboard/photos");
  revalidatePath("/dashboard/sms");
  revalidatePath("/dashboard/notifications");

  if (result.errors && !result.sent) {
    return {
      ok: false,
      error: "Could not send gallery texts. Check Twilio and try again.",
    };
  }

  const parts = [
    result.sent
      ? `Sent ${result.sent} gallery text${result.sent === 1 ? "" : "s"}`
      : "No new gallery texts to send",
  ];
  if (result.skipped) {
    parts.push(
      `${result.skipped} already sent or skipped`
    );
  }
  return { ok: true, message: `${parts.join(". ")}.` };
}

export async function sendTodaysGalleriesFormAction(
  date: string,
  _prev: SendGalleriesResult | null
): Promise<SendGalleriesResult> {
  return sendTodaysGalleriesAction(date);
}
