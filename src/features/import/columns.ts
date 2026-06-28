/** Column order for the onboarding CSV template (one row per dog). */
export const IMPORT_COLUMNS = [
  "customer_owner_name",
  "customer_phone",
  "customer_email",
  "customer_address",
  "customer_secondary_owner_name",
  "customer_secondary_phone",
  "customer_notes",
  "dog_name",
  "dog_breed",
  "route_name",
  "schedule_days",
  "pickup_window_start",
  "pickup_window_end",
  "dog_notes",
  "hike_rate",
] as const;

export type ImportColumn = (typeof IMPORT_COLUMNS)[number];

export const IMPORT_COLUMN_LABELS: Record<ImportColumn, string> = {
  customer_owner_name: "Customer owner name",
  customer_phone: "Customer phone",
  customer_email: "Customer email",
  customer_address: "Customer address",
  customer_secondary_owner_name: "Second contact name",
  customer_secondary_phone: "Second contact phone",
  customer_notes: "Customer notes",
  dog_name: "Dog name",
  dog_breed: "Dog breed",
  route_name: "Route name",
  schedule_days: "Schedule days (Mon,Tue or 1,3,5)",
  pickup_window_start: "Pickup window start (HH:MM)",
  pickup_window_end: "Pickup window end (HH:MM)",
  dog_notes: "Dog notes",
  hike_rate: "Hike rate (dollars)",
};

export const MAX_IMPORT_ROWS = 500;
