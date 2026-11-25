import { defaultTrialWindow } from "@/features/subscription/helpers";

/** Trial window written when the first admin actually joins, in CAD. */
export function trialClockUpdate(from = new Date()): {
  status: "trial";
  trial_starts_at: string;
  trial_ends_at: string;
  started_at: string;
  billing_currency: "CAD";
  monthly_price: 0;
} {
  const { trialStartsAt, trialEndsAt } = defaultTrialWindow(from);
  return {
    status: "trial",
    trial_starts_at: trialStartsAt,
    trial_ends_at: trialEndsAt,
    started_at: trialStartsAt,
    billing_currency: "CAD",
    monthly_price: 0,
  };
}

/** Top-bar copy. Null when this is not a live trial. */
export function trialStatusChip(daysLeft: number | null): string | null {
  if (daysLeft == null || daysLeft < 0) return null;
  const noun = daysLeft === 1 ? "day" : "days";
  return `Trial · ${daysLeft} ${noun} left · Choose plan`;
}

export function formatTrialEndDate(iso: string, timeZone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "long",
    timeZone,
  }).format(date);
}
