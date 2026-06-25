import type { StopStatus } from "@/types";

export type BillingStatus =
  | "completed"
  | "cancelled"
  | "skipped"
  | "no_show"
  | "pending";

const INCOMPLETE: StopStatus[] = ["scheduled", "en_route", "arrived"];

export function deriveBillingStatus(
  pickupStatus: StopStatus,
  dropoffStatus: StopStatus | null,
  hikeDate: string,
  today: string
): { billingStatus: BillingStatus; billable: boolean } {
  if (dropoffStatus === "dropped_off" || pickupStatus === "picked_up") {
    return { billingStatus: "completed", billable: true };
  }

  if (pickupStatus === "cancelled" || dropoffStatus === "cancelled") {
    return { billingStatus: "cancelled", billable: false };
  }

  if (pickupStatus === "skipped" || dropoffStatus === "skipped") {
    return { billingStatus: "skipped", billable: false };
  }

  if (hikeDate < today && INCOMPLETE.includes(pickupStatus)) {
    return { billingStatus: "no_show", billable: false };
  }

  return { billingStatus: "pending", billable: false };
}

export function billingStatusLabel(status: BillingStatus): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "skipped":
      return "Skipped";
    case "no_show":
      return "No show";
    case "pending":
      return "Pending";
  }
}
