const REQUEST_LABELS: Record<string, string> = {
  skip_tomorrow: "Skip tomorrow",
  skip_weekday: "Skip a weekday",
  skip_date: "Skip a day",
  vacation: "Vacation / time off",
  pause: "Pause service",
  resume: "Resume service",
};

export function requestTypeLabel(commandType: string): string {
  return REQUEST_LABELS[commandType] ?? commandType.replaceAll("_", " ");
}

/** Turn stored reasons like "SMS: skip_tomorrow" into the same labels the queue uses. */
export function humanRequestReason(reason: string | null | undefined): string {
  if (!reason?.trim()) return "—";
  const sms = reason.trim().match(/^SMS:\s*(.+)$/i);
  if (!sms?.[1]) return reason.trim();
  return requestTypeLabel(sms[1].trim());
}
