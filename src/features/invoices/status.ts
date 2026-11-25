import type { InvoiceStatus, PaymentMethod } from "@/types";

export function invoiceStatusLabel(status: InvoiceStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "sent":
      return "Sent";
    case "paid":
      return "Paid";
    case "overdue":
      return "Overdue";
  }
}

export function invoiceStatusTone(
  status: InvoiceStatus
): "green" | "amber" | "red" | "neutral" {
  switch (status) {
    case "paid":
      return "green";
    case "sent":
      return "amber";
    case "overdue":
      return "red";
    default:
      return "neutral";
  }
}

export function paymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case "e_transfer":
      return "Interac e-Transfer";
    case "cash":
      return "Cash";
    case "card":
      return "Card (online)";
    case "other":
      return "Other";
  }
}
