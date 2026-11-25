/**
 * Pure rules for close-out gallery texts (#125).
 * One text per owner per hike date. The /p/ link shows every tagged photo
 * from that day, so a morning send still covers an afternoon hike.
 */

export function formatDogList(names: string[]): string {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort();
  if (unique.length === 0) return "Your dog";
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")}, and ${unique.at(-1)}`;
}

/** "today" or "on Tue, Nov 24" in the company timezone. */
export function galleryWhenLabel(
  hikeDate: string,
  today: string,
  timeZone: string
): string {
  if (hikeDate === today) return "today";
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${hikeDate}T12:00:00`));
  return `on ${label}`;
}

export function buildHikeGalleryMessage(
  dogNames: string[],
  photosUrl: string,
  whenLabel = "today"
): string {
  const dogs = formatDogList(dogNames);
  return `${dogs} had a great hike ${whenLabel}! See the pics: ${photosUrl}`;
}

export type GalleryDeliveryRow = {
  status: string;
  body: string;
  notificationType: string;
};

/**
 * LIKE pattern for a share token inside an SMS body.
 * `_` and `%` are wildcards in LIKE/ILIKE; base64url tokens include `_`.
 */
export function galleryTokenLikePattern(token: string): string {
  const escaped = token
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
  return `%/p/${escaped}%`;
}

/** Shared SMS wait for a bulk close-out, not 12s times the number of routes. */
export const BULK_GALLERY_SMS_BUDGET_MS = 18_000;

export function gallerySendBudgetExceeded(
  now: number,
  deadlineMs: number | undefined
): boolean {
  return deadlineMs != null && now >= deadlineMs;
}

export function bulkCloseOutConfirmBody(input: {
  routeCount: number;
  galleryTextsOn: boolean;
  galleryRecipientCount: number | null;
}): string {
  const routes =
    input.routeCount === 1
      ? "1 incomplete route"
      : `${input.routeCount} incomplete routes`;
  const base = `This cannot be undone. Close out ${routes}? Open stops will be marked picked up or dropped off.`;
  if (!input.galleryTextsOn) {
    return `${base} Gallery texts are off in Settings, so no owners will be texted.`;
  }
  if (input.galleryRecipientCount == null) {
    return `${base} Gallery texts will go to owners with tagged photos who have not already received a link.`;
  }
  if (input.galleryRecipientCount === 0) {
    return `${base} No tagged photos on these routes, so no gallery texts will be sent.`;
  }
  const owners =
    input.galleryRecipientCount === 1
      ? "1 owner"
      : `${input.galleryRecipientCount} owners`;
  return `${base} Gallery texts will go to up to ${owners} with tagged photos who have not already received a link.`;
}

/**
 * True when a sent gallery text, or a drop-off text that already included a
 * gallery link, covers one of this day's share tokens. Failed and pending
 * rows do not count, so a Twilio failure can be retried.
 */
export function galleryLinkAlreadySent(
  messages: GalleryDeliveryRow[],
  tokens: string[]
): boolean {
  const live = tokens.filter(Boolean);
  if (!live.length) return false;
  return messages.some(
    (message) =>
      message.status === "sent" &&
      (message.notificationType === "hike_photos" ||
        message.notificationType === "dropped_off") &&
      live.some((token) => message.body.includes(`/p/${token}`))
  );
}
