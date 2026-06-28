import { csvRow } from "@/lib/csv";
import {
  formatScheduleDaysForCsv,
  formatScheduleDayLabels,
} from "@/lib/dates";
import { IMPORT_COLUMNS } from "@/features/import/columns";
import { one } from "@/lib/supabase/relations";

export type ImportExportRow = {
  customer_owner_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  customer_secondary_owner_name: string;
  customer_secondary_phone: string;
  customer_notes: string;
  dog_name: string;
  dog_breed: string;
  route_name: string;
  schedule_days: string;
  pickup_window_start: string;
  pickup_window_end: string;
  dog_notes: string;
  hike_rate: string;
};

function formatTimeForCsv(time: string): string {
  const [hour, minute] = time.split(":");
  return `${hour}:${minute ?? "00"}`;
}

function formatHikeRate(cents: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

function rowToValues(row: ImportExportRow): string[] {
  return IMPORT_COLUMNS.map((col) => row[col] ?? "");
}

export function importRowsToCsv(rows: ImportExportRow[]): string {
  const header = csvRow([...IMPORT_COLUMNS]);
  const data = rows.map((row) => csvRow(rowToValues(row)));
  return [header, ...data].join("\n");
}

const EXAMPLE_ROWS: ImportExportRow[] = [
  {
    customer_owner_name: "Jane Smith",
    customer_phone: "5551234567",
    customer_email: "jane@example.com",
    customer_address: "123 Main St, Vancouver BC",
    customer_secondary_owner_name: "John Smith",
    customer_secondary_phone: "5559876543",
    customer_notes: "",
    dog_name: "Buddy",
    dog_breed: "Golden Retriever",
    route_name: "North Route",
    schedule_days: "Mon,Wed,Fri",
    pickup_window_start: "08:00",
    pickup_window_end: "08:30",
    dog_notes: "Friendly with other dogs",
    hike_rate: "35.00",
  },
  {
    customer_owner_name: "Jane Smith",
    customer_phone: "5551234567",
    customer_email: "",
    customer_address: "",
    customer_secondary_owner_name: "",
    customer_secondary_phone: "",
    customer_notes: "",
    dog_name: "Max",
    dog_breed: "Labrador",
    route_name: "North Route",
    schedule_days: "Mon,Wed,Fri",
    pickup_window_start: "08:00",
    pickup_window_end: "08:30",
    dog_notes: "",
    hike_rate: "",
  },
  {
    customer_owner_name: "Alex Rivera",
    customer_phone: "5555550100",
    customer_email: "alex@example.com",
    customer_address: "456 Oak Ave, Burnaby BC",
    customer_secondary_owner_name: "",
    customer_secondary_phone: "",
    customer_notes: "Gate code 1234",
    dog_name: "",
    dog_breed: "",
    route_name: "",
    schedule_days: "",
    pickup_window_start: "",
    pickup_window_end: "",
    dog_notes: "",
    hike_rate: "",
  },
];

export function buildImportTemplateCsv(includeExamples: boolean): string {
  if (!includeExamples) {
    return importRowsToCsv([]);
  }
  return importRowsToCsv(EXAMPLE_ROWS);
}

type CustomerExport = {
  id: string;
  owner_name: string;
  phone: string;
  email: string | null;
  address: string;
  secondary_owner_name: string | null;
  secondary_phone: string | null;
  notes: string | null;
};

type DogExport = {
  id: string;
  customer_id: string;
  name: string;
  breed: string | null;
  notes: string | null;
  pickup_window_start: string;
  pickup_window_end: string;
  hike_rate_cents: number | null;
  routes: { name: string } | { name: string }[] | null;
  dog_schedule_days: { day_of_week: number }[] | null;
};

export function buildExportCsvFromData(
  customers: CustomerExport[],
  dogs: DogExport[]
): string {
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const rows: ImportExportRow[] = [];

  if (dogs.length === 0) {
    for (const customer of customers) {
      rows.push(customerToRow(customer));
    }
    return importRowsToCsv(rows);
  }

  const customersWithDogs = new Set<string>();

  for (const dog of dogs) {
    const customer = customerById.get(dog.customer_id);
    if (!customer) continue;

    customersWithDogs.add(customer.id);
    const scheduleDays = (dog.dog_schedule_days ?? []).map((d) => d.day_of_week);
    const route = one(dog.routes);

    rows.push({
      customer_owner_name: customer.owner_name,
      customer_phone: customer.phone,
      customer_email: customer.email ?? "",
      customer_address: customer.address,
      customer_secondary_owner_name: customer.secondary_owner_name ?? "",
      customer_secondary_phone: customer.secondary_phone ?? "",
      customer_notes: customer.notes ?? "",
      dog_name: dog.name,
      dog_breed: dog.breed ?? "",
      route_name: route?.name ?? "",
      schedule_days: formatScheduleDaysForCsv(scheduleDays),
      pickup_window_start: formatTimeForCsv(dog.pickup_window_start),
      pickup_window_end: formatTimeForCsv(dog.pickup_window_end),
      dog_notes: dog.notes ?? "",
      hike_rate: formatHikeRate(dog.hike_rate_cents),
    });
  }

  for (const customer of customers) {
    if (!customersWithDogs.has(customer.id)) {
      rows.push(customerToRow(customer));
    }
  }

  rows.sort((a, b) => {
    const nameCmp = a.customer_owner_name.localeCompare(b.customer_owner_name);
    if (nameCmp !== 0) return nameCmp;
    return a.dog_name.localeCompare(b.dog_name);
  });

  return importRowsToCsv(rows);
}

function customerToRow(customer: CustomerExport): ImportExportRow {
  return {
    customer_owner_name: customer.owner_name,
    customer_phone: customer.phone,
    customer_email: customer.email ?? "",
    customer_address: customer.address,
    customer_secondary_owner_name: customer.secondary_owner_name ?? "",
    customer_secondary_phone: customer.secondary_phone ?? "",
    customer_notes: customer.notes ?? "",
    dog_name: "",
    dog_breed: "",
    route_name: "",
    schedule_days: "",
    pickup_window_start: "",
    pickup_window_end: "",
    dog_notes: "",
    hike_rate: "",
  };
}

export function formatScheduleDaysHint(days: number[]): string {
  return formatScheduleDayLabels(days);
}
