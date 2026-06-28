import { escapeCsv } from "@/lib/csv";
import { billingStatusLabel } from "@/features/billing/status";
import type { BillingLineItem } from "@/features/billing/queries";

function formatCents(cents: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

export function billingReportToCsv(items: BillingLineItem[]): string {
  const headers = [
    "Date",
    "Customer",
    "Dog",
    "Pickup Status",
    "Dropoff Status",
    "Billing Status",
    "Billable",
    "Rate",
    "Line Total",
  ];

  const rows = items.map((item) =>
    [
      item.date,
      item.customerName,
      item.dogName,
      item.pickupStatus,
      item.dropoffStatus ?? "",
      billingStatusLabel(item.billingStatus),
      item.billable ? "Yes" : "No",
      formatCents(item.rateCents),
      item.billable && item.rateCents != null
        ? formatCents(item.rateCents)
        : "",
    ]
      .map(escapeCsv)
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
