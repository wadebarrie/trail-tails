import { createServiceClient } from "@/lib/supabase/service";
import { getUtcBoundsForLocalDate } from "@/lib/dates";
import {
  buildHikeGalleryMessage,
  logNotification,
} from "@/features/notifications/log";
import { buildGalleryUrl } from "@/features/hike-photos/share";
import { logErrorFromException, logWarn } from "@/lib/logger";

export type GallerySmsResult = {
  sent: number;
  skipped: number;
  errors: number;
};

/**
 * Text each owner who has tagged photos on this hike a gallery link.
 * Dedupes to one hike_photos SMS per customer per company local day.
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
  const { startIso, endIso } = getUtcBoundsForLocalDate(timeZone, hike.date);

  const { data: shares } = await supabase
    .from("hike_photo_shares")
    .select("id, customer_id, token, expires_at, revoked_at")
    .eq("hike_id", hikeId)
    .is("revoked_at", null);

  for (const share of shares ?? []) {
    if (new Date(share.expires_at as string).getTime() < Date.now()) {
      result.skipped += 1;
      continue;
    }

    const customerId = share.customer_id as string;

    const { data: already } = await supabase
      .from("notification_log")
      .select("id")
      .eq("company_id", hike.company_id)
      .eq("customer_id", customerId)
      .eq("notification_type", "hike_photos")
      .gte("created_at", startIso)
      .lt("created_at", endIso)
      .limit(1)
      .maybeSingle();

    if (already) {
      result.skipped += 1;
      continue;
    }

    const dogNames = await dogNamesTaggedForCustomer(hikeId, customerId);
    if (!dogNames.length) {
      result.skipped += 1;
      continue;
    }

    const url = buildGalleryUrl(share.token as string);
    const body = buildHikeGalleryMessage(dogNames, url);

    try {
      await logNotification({
        companyId: hike.company_id,
        customerId,
        notificationType: "hike_photos",
        body,
      });
      result.sent += 1;
    } catch (error) {
      result.errors += 1;
      logErrorFromException("sms", "Gallery SMS failed", error, {
        companyId: hike.company_id,
        context: { hikeId, customerId },
      });
    }
  }

  return result;
}

async function dogNamesTaggedForCustomer(
  hikeId: string,
  customerId: string
): Promise<string[]> {
  const supabase = createServiceClient();
  const { data: photos } = await supabase
    .from("hike_photos")
    .select("id")
    .eq("hike_id", hikeId);

  const photoIds = (photos ?? []).map((p) => p.id as string);
  if (!photoIds.length) return [];

  const { data: tags } = await supabase
    .from("hike_photo_dogs")
    .select("dog_id, dogs ( name, customer_id )")
    .in("photo_id", photoIds);

  const names = new Set<string>();
  for (const row of tags ?? []) {
    const dog = Array.isArray(row.dogs) ? row.dogs[0] : row.dogs;
    if (
      dog &&
      typeof dog === "object" &&
      "customer_id" in dog &&
      (dog as { customer_id: string }).customer_id === customerId
    ) {
      const name = (dog as { name?: string }).name?.trim();
      if (name) names.add(name);
    }
  }
  return [...names].sort();
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
