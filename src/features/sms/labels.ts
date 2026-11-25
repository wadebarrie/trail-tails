/** Type chip + status tone for the Texts sent log (#126). */

const TYPE_LABELS: Record<string, string> = {
  hike_photos: "Gallery",
  dropped_off: "Drop-off",
  picked_up: "Pickup",
  en_route: "On the way",
  arrived: "Arrived",
  night_before: "Reminder",
  request_received: "Request",
  request_approved: "Approved",
  request_declined: "Declined",
  help: "Help",
};

export function smsTypeLabel(input: {
  direction: string;
  notificationType: string | null;
  body: string;
}): string {
  if (input.direction === "inbound") return "Reply";
  if (input.notificationType && TYPE_LABELS[input.notificationType]) {
    return TYPE_LABELS[input.notificationType];
  }

  const body = input.body;
  if (/see the pics:/i.test(body)) return "Gallery";
  if (/has been dropped off/i.test(body)) return "Drop-off";
  if (/has been picked up/i.test(body)) return "Pickup";
  if (/we've arrived/i.test(body)) return "Arrived";
  if (/on the way/i.test(body)) return "On the way";
  if (
    /booked for a hike tomorrow/i.test(body) ||
    /tomorrow's pickups/i.test(body)
  ) {
    return "Reminder";
  }
  return "Text";
}

/** Office label for a notification that never became a sent text. */
export function unsentNotificationLabel(errorMessage: string | null): string {
  if ((errorMessage ?? "").toLowerCase().includes("budget exhausted")) {
    return "Not sent";
  }
  return "Unconfirmed";
}

export function smsStatusTone(
  status: string
): "green" | "red" | "amber" | "neutral" {
  if (status === "sent" || status === "delivered") return "green";
  if (status === "failed") return "red";
  if (status === "pending" || status === "queued") return "amber";
  return "neutral";
}
