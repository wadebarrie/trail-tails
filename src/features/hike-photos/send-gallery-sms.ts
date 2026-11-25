import { createServiceClient } from "@/lib/supabase/service";
import { getDateInTimezone } from "@/lib/dates";
import { logNotification } from "@/features/notifications/log";
import { buildGalleryUrl } from "@/features/hike-photos/share";
import {
  buildHikeGalleryMessage,
  galleryLinkAlreadySent,
  galleryWhenLabel,
  type GalleryDeliveryRow,
} from "@/features/hike-photos/gallery-sms-rules";
import { logErrorFromException, logWarn } from "@/lib/logger";

export type GallerySmsResult = {
  sent: number;
  skipped: number;
  errors: number;
};

/** Close-out waits for the text, but not forever if Twilio hangs. */
const GALLERY_SMS_BUDGET_MS = 12_000;

type ShareRow = {
  hikeId: string;
  customerId: string;
  token: string;
  expiresAt: string;
};

type TagRow = {
  hikeId: string;
  customerId: string;
  dogName: string;
};

/**
 * Text each owner who has tagged photos on this hike.
 * One text per owner per hike date. The link is a daily gallery (every tagged
 * photo that day), so a later hike does not send a second text.
 * When `force` is false, respects companies.auto_send_gallery_on_closeout.
 */
export async function sendHikeGallerySmsForHike(
  hikeId: string,
  options: { force?: boolean } = {}
): Promise<GallerySmsResult> {
  const force = options.force === true;
  const supabase = createServiceClient();
  const result: GallerySmsResult = { sent: 0, skipped: 0, errors: 0 };

  const { data: hike, error: hikeError } = await supabase
    .from("hikes")
    .select("id, company_id, date, status")
    .eq("id", hikeId)
    .maybeSingle();

  if (hikeError || !hike) {
    logWarn("sms", `Gallery SMS skipped — hike ${hikeId} not found`);
    return result;
  }

  const { data: company } = await supabase
    .from("companies")
    .select("timezone, auto_send_gallery_on_closeout")
    .eq("id", hike.company_id)
    .maybeSingle();

  if (!force && company?.auto_send_gallery_on_closeout === false) {
    return result;
  }

  const timeZone = company?.timezone ?? "America/Vancouver";
  const companyId = hike.company_id as string;
  const hikeDate = hike.date as string;

  const day = await loadDayGalleryContext(companyId, hikeDate);
  const sharesOnHike = day.shares.filter((share) => share.hikeId === hikeId);

  const prior = await sentGalleryMessages(
    companyId,
    day.shares.map((share) => share.token)
  );

  const today = getDateInTimezone(timeZone, 0);
  const whenLabel = galleryWhenLabel(hikeDate, today, timeZone);

  for (const share of sharesOnHike) {
    if (new Date(share.expiresAt).getTime() < Date.now()) {
      result.skipped += 1;
      continue;
    }

    const namesOnHike = dogNames(day.tags, share.customerId, hikeId);
    if (!namesOnHike.length) {
      result.skipped += 1;
      continue;
    }

    const dayTokens = day.shares
      .filter((row) => row.customerId === share.customerId)
      .map((row) => row.token);
    if (galleryLinkAlreadySent(prior.get(share.customerId) ?? [], dayTokens)) {
      result.skipped += 1;
      continue;
    }

    const names = dogNames(day.tags, share.customerId);
    const url = buildGalleryUrl(share.token);
    const body = buildHikeGalleryMessage(names.length ? names : namesOnHike, url, whenLabel);

    try {
      const delivery = await logNotification({
        companyId,
        customerId: share.customerId,
        notificationType: "hike_photos",
        body,
      });
      if (delivery.sent > 0) {
        result.sent += 1;
        prior.set(share.customerId, [
          ...(prior.get(share.customerId) ?? []),
          {
            status: "sent",
            notificationType: "hike_photos",
            body,
            createdAt: new Date().toISOString(),
          },
        ]);
      } else if (delivery.failed > 0) {
        result.errors += 1;
      } else {
        result.skipped += 1;
      }
    } catch (error) {
      result.errors += 1;
      logErrorFromException("sms", "Gallery SMS failed", error, {
        companyId,
        context: { hikeId, customerId: share.customerId },
      });
    }
  }

  return result;
}

/**
 * Await gallery SMS in the close-out request. Netlify can drop work that
 * is not awaited. The budget keeps a hung Twilio call from blocking close-out.
 */
export async function awaitGallerySmsOnCloseOut(hikeId: string): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      sendHikeGallerySmsForHike(hikeId, { force: false }).then(() => undefined),
      new Promise<void>((resolve) => {
        timeout = setTimeout(resolve, GALLERY_SMS_BUDGET_MS);
      }),
    ]);
  } catch (error) {
    logErrorFromException("sms", "Gallery SMS on close-out failed", error, {
      context: { hikeId },
    });
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

/** Send gallery SMS for every hike on a company local date (manual review mode). */
export async function sendGallerySmsForCompanyDate(
  companyId: string,
  date: string
): Promise<GallerySmsResult> {
  const supabase = createServiceClient();
  const { data: hikes } = await supabase
    .from("hikes")
    .select("id")
    .eq("company_id", companyId)
    .eq("date", date);

  const aggregate: GallerySmsResult = { sent: 0, skipped: 0, errors: 0 };
  for (const hike of hikes ?? []) {
    const partial = await sendHikeGallerySmsForHike(hike.id, { force: true });
    aggregate.sent += partial.sent;
    aggregate.skipped += partial.skipped;
    aggregate.errors += partial.errors;
  }
  return aggregate;
}

export type GalleryTextStatus = {
  state: "sent" | "unsent";
  sentAt: string | null;
  via: "gallery" | "dropoff" | null;
};

/**
 * Per-owner status for the Hike photos page. "Sent" includes a drop-off text
 * that already contained that day's gallery link. Failed sends stay unsent.
 */
export async function galleryTextStatusForDate(
  companyId: string,
  date: string,
  shares: { customerId: string; token: string }[]
): Promise<Map<string, GalleryTextStatus>> {
  const status = new Map<string, GalleryTextStatus>();
  const tokens = [...new Set(shares.map((share) => share.token).filter(Boolean))];
  if (!tokens.length) return status;

  const notes = await sentGalleryMessages(companyId, tokens);

  for (const share of shares) {
    if (status.get(share.customerId)?.state === "sent") continue;
    const dayTokens = shares
      .filter((row) => row.customerId === share.customerId)
      .map((row) => row.token);
    const match = (notes.get(share.customerId) ?? []).find(
      (row) =>
        row.status === "sent" &&
        dayTokens.some((token) => row.body.includes(`/p/${token}`))
    );
    status.set(
      share.customerId,
      match
        ? {
            state: "sent",
            sentAt: match.createdAt,
            via: match.notificationType === "dropped_off" ? "dropoff" : "gallery",
          }
        : { state: "unsent", sentAt: null, via: null }
    );
  }

  return status;
}

async function loadDayGalleryContext(
  companyId: string,
  date: string
): Promise<{ shares: ShareRow[]; tags: TagRow[] }> {
  const supabase = createServiceClient();
  const { data: hikes } = await supabase
    .from("hikes")
    .select("id")
    .eq("company_id", companyId)
    .eq("date", date);

  const hikeIds = (hikes ?? []).map((hike) => hike.id as string);
  if (!hikeIds.length) return { shares: [], tags: [] };

  const [sharesResult, photosResult] = await Promise.all([
    supabase
      .from("hike_photo_shares")
      .select("hike_id, customer_id, token, expires_at, revoked_at")
      .eq("company_id", companyId)
      .in("hike_id", hikeIds)
      .is("revoked_at", null),
    supabase
      .from("hike_photos")
      .select("id, hike_id")
      .eq("company_id", companyId)
      .in("hike_id", hikeIds),
  ]);

  const shares: ShareRow[] = (sharesResult.data ?? []).map((row) => ({
    hikeId: row.hike_id as string,
    customerId: row.customer_id as string,
    token: row.token as string,
    expiresAt: row.expires_at as string,
  }));

  const photoIds = (photosResult.data ?? []).map((row) => row.id as string);
  const hikeByPhoto = new Map(
    (photosResult.data ?? []).map((row) => [row.id as string, row.hike_id as string])
  );
  if (!photoIds.length) return { shares, tags: [] };

  const { data: tagRows } = await supabase
    .from("hike_photo_dogs")
    .select("photo_id, dogs ( name, customer_id )")
    .in("photo_id", photoIds);

  const tags: TagRow[] = [];
  for (const row of tagRows ?? []) {
    const dog = Array.isArray(row.dogs) ? row.dogs[0] : row.dogs;
    if (!dog || typeof dog !== "object" || !("customer_id" in dog)) continue;
    const name = (dog as { name?: string }).name?.trim();
    const customerId = (dog as { customer_id: string }).customer_id;
    const hikeId = hikeByPhoto.get(row.photo_id as string);
    if (!name || !hikeId) continue;
    tags.push({ hikeId, customerId, dogName: name });
  }

  return { shares, tags };
}

function dogNames(tags: TagRow[], customerId: string, hikeId?: string): string[] {
  const names = new Set<string>();
  for (const tag of tags) {
    if (tag.customerId !== customerId) continue;
    if (hikeId && tag.hikeId !== hikeId) continue;
    names.add(tag.dogName);
  }
  return [...names].sort();
}

type SentNote = GalleryDeliveryRow & { createdAt: string };

async function sentGalleryMessages(
  companyId: string,
  tokens: string[]
): Promise<Map<string, SentNote[]>> {
  const byCustomer = new Map<string, SentNote[]>();
  const unique = [...new Set(tokens.filter(Boolean))];
  if (!unique.length) return byCustomer;

  const supabase = createServiceClient();

  for (let i = 0; i < unique.length; i += 20) {
    const chunk = unique.slice(i, i + 20);
    const filter = chunk.map((token) => `body.ilike.%/p/${token}%`).join(",");
    const { data, error } = await supabase
      .from("notification_log")
      .select("customer_id, notification_type, body, status, created_at")
      .eq("company_id", companyId)
      .eq("status", "sent")
      .in("notification_type", ["hike_photos", "dropped_off"])
      .or(filter);

    if (error) {
      logWarn("sms", `Gallery SMS history lookup failed: ${error.message}`);
      continue;
    }

    for (const row of data ?? []) {
      const customerId = row.customer_id as string | null;
      if (!customerId) continue;
      const list = byCustomer.get(customerId) ?? [];
      list.push({
        status: row.status as string,
        notificationType: row.notification_type as string,
        body: row.body as string,
        createdAt: (row.created_at as string) ?? "",
      });
      byCustomer.set(customerId, list);
    }
  }

  return byCustomer;
}
