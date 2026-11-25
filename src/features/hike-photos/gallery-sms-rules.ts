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
