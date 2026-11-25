import { createServiceClient } from "@/lib/supabase/service";
import { getDateInTimezone } from "@/lib/dates";
import { logNotification } from "@/features/notifications/log";
import { buildGalleryUrl } from "@/features/hike-photos/share";
import {
  ABANDONED_GALLERY_CLAIM_MS,
  SINGLE_GALLERY_SMS_BUDGET_MS,
  buildHikeGalleryMessage,
  galleryClaimCanRetry,
  galleryLinkAlreadySent,
  gallerySendBudgetExceeded,
  galleryTokenLikePattern,
  galleryWhenLabel,
  type GalleryDeliveryRow,
} from "@/features/hike-photos/gallery-sms-rules";
import { findRecentOutboundSms } from "@/lib/twilio";
import { logErrorFromException, logWarn } from "@/lib/logger";

export type GallerySmsResult = {
  sent: number;
  skipped: number;
  errors: number;
  /** Hikes or owners skipped because the shared bulk budget ran out. */
  deferred: number;
};


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
  options: { force?: boolean; deadlineMs?: number } = {}
): Promise<GallerySmsResult> {
  const force = options.force === true;
  const supabase = createServiceClient();
  const result: GallerySmsResult = { sent: 0, skipped: 0, errors: 0, deferred: 0 };

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
    if (gallerySendBudgetExceeded(Date.now(), options.deadlineMs)) {
      result.deferred += 1;
      continue;
    }

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

    const claim = await claimGallerySend(companyId, share.customerId, hikeDate);
    if (claim === "taken") {
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
        if (claim === "claimed") {
          await markGalleryClaim(companyId, share.customerId, hikeDate, "sent");
        }
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
      } else if (delivery.unknown > 0) {
        // Leave the claim pending. A timeout can still be delivered.
        result.deferred += 1;
      } else {
        if (claim === "claimed" && delivery.failed > 0) {
          await markGalleryClaim(companyId, share.customerId, hikeDate, "failed");
        }
        if (delivery.failed > 0) result.errors += 1;
        else result.skipped += 1;
      }
    } catch (error) {
      // Leave the claim pending. An exception after Twilio accepted must not
      // become an immediate retry.
      result.deferred += 1;
      logErrorFromException("sms", "Gallery SMS failed", error, {
        companyId,
        context: { hikeId, customerId: share.customerId },
      });
    }
  }

  return result;
}

/**
 * Await gallery SMS in the driver close-out request. The send stops starting
 * new texts after a short budget, and each Twilio call itself times out.
 */
export async function awaitGallerySmsOnCloseOut(hikeId: string): Promise<void> {
  try {
    await sendHikeGallerySmsForHike(hikeId, {
      force: false,
      deadlineMs: Date.now() + SINGLE_GALLERY_SMS_BUDGET_MS,
    });
  } catch (error) {
    logErrorFromException("sms", "Gallery SMS on close-out failed", error, {
      context: { hikeId },
    });
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

  return sendGallerySmsForHikeIds(
    (hikes ?? []).map((hike) => hike.id as string),
    { force: true }
  );
}

/**
 * Second pass after hikes are already closed. `deadlineMs` is one budget for
 * the whole list so a large range cannot spend 12s per route.
 */
export async function sendGallerySmsForHikeIds(
  hikeIds: string[],
  options: { force?: boolean; deadlineMs?: number } = {}
): Promise<GallerySmsResult> {
  const aggregate: GallerySmsResult = { sent: 0, skipped: 0, errors: 0, deferred: 0 };
  for (const hikeId of hikeIds) {
    if (gallerySendBudgetExceeded(Date.now(), options.deadlineMs)) {
      aggregate.deferred += 1;
      continue;
    }
    const partial = await sendHikeGallerySmsForHike(hikeId, options);
    aggregate.sent += partial.sent;
    aggregate.skipped += partial.skipped;
    aggregate.errors += partial.errors;
    aggregate.deferred += partial.deferred;
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

type GalleryClaim = "claimed" | "taken" | "unprotected";

/** Insert a pending row first so a second close-out cannot also send. */
async function claimGallerySend(
  companyId: string,
  customerId: string,
  hikeDate: string
): Promise<GalleryClaim> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("hike_photo_gallery_sends")
    .insert({
      company_id: companyId,
      customer_id: customerId,
      hike_date: hikeDate,
      status: "pending",
    })
    .select("id")
    .maybeSingle();

  if (!error && data) return "claimed";

  const missingTable =
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    (error?.message ?? "").includes("hike_photo_gallery_sends");
  if (missingTable) {
    logWarn(
      "sms",
      "Gallery send claim table missing — apply migration 20261125010000_gallery_send_claims.sql"
    );
    return "unprotected";
  }

  if (error && error.code !== "23505") {
    logWarn("sms", `Gallery send claim failed: ${error.message}`);
    return "unprotected";
  }

  const reclaimedFailed = await supabase
    .from("hike_photo_gallery_sends")
    .update({ status: "pending", created_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .eq("customer_id", customerId)
    .eq("hike_date", hikeDate)
    .eq("status", "failed")
    .select("id");
  if (reclaimedFailed.data?.length) return "claimed";

  const { data: existing } = await supabase
    .from("hike_photo_gallery_sends")
    .select("status, created_at")
    .eq("company_id", companyId)
    .eq("customer_id", customerId)
    .eq("hike_date", hikeDate)
    .maybeSingle();
  if (!existing) return "taken";

  const createdAt = existing.created_at as string;
  const ageMs = Date.now() - new Date(createdAt).getTime();
  if (!galleryClaimCanRetry(existing.status as string, ageMs)) return "taken";
  if (existing.status !== "pending") return "taken";

  const delivery = await confirmAbandonedGallerySend(
    companyId,
    customerId,
    createdAt
  );
  if (delivery === "sent") {
    await markGalleryClaim(companyId, customerId, hikeDate, "sent");
    return "taken";
  }

  const { data: reclaimed } = await supabase
    .from("hike_photo_gallery_sends")
    .update({ status: "pending", created_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .eq("customer_id", customerId)
    .eq("hike_date", hikeDate)
    .eq("status", "pending")
    .lte("created_at", new Date(Date.now() - ABANDONED_GALLERY_CLAIM_MS).toISOString())
    .select("id");
  if (reclaimed?.length) return "claimed";

  return "taken";
}

/** A pending claim left behind by a crashed send. Don't retry if Twilio has it. */
async function confirmAbandonedGallerySend(
  companyId: string,
  customerId: string,
  since: string
): Promise<"sent" | "failed" | "unknown"> {
  const supabase = createServiceClient();
  const { data: notes } = await supabase
    .from("notification_log")
    .select("body, status")
    .eq("company_id", companyId)
    .eq("customer_id", customerId)
    .eq("notification_type", "hike_photos")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5);

  if ((notes ?? []).some((note) => note.status === "sent")) return "sent";

  const body = (notes ?? []).find((note) => note.body)?.body as string | undefined;
  if (!body) return "unknown";

  const { data: customer } = await supabase
    .from("customers")
    .select("phone, secondary_phone")
    .eq("id", customerId)
    .maybeSingle();
  const phones = [customer?.phone, customer?.secondary_phone]
    .map((phone) => (typeof phone === "string" ? phone.trim() : ""))
    .filter(Boolean);
  if (!phones.length) return "unknown";

  let sawFailure = false;
  for (const phone of phones) {
    const lookedUp = await findRecentOutboundSms(phone, body);
    if (lookedUp.outcome === "sent") return "sent";
    if (lookedUp.outcome === "failed") sawFailure = true;
  }
  return sawFailure ? "failed" : "unknown";
}

async function markGalleryClaim(
  companyId: string,
  customerId: string,
  hikeDate: string,
  status: "sent" | "failed"
) {
  const supabase = createServiceClient();
  // A late Twilio success must overwrite a timeout's "failed" mark.
  // A late failure must not overwrite "sent".
  let query = supabase
    .from("hike_photo_gallery_sends")
    .update({
      status,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    })
    .eq("company_id", companyId)
    .eq("customer_id", customerId)
    .eq("hike_date", hikeDate);
  if (status === "failed") query = query.eq("status", "pending");
  const { error } = await query;
  if (error) {
    logWarn("sms", `Gallery send claim update failed: ${error.message}`);
  }
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
    const filter = chunk
      .map((token) => `body.like.${galleryTokenLikePattern(token)}`)
      .join(",");
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
