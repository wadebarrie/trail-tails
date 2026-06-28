import { z } from "zod";
import { customerSchema, secondaryContactPayload } from "@/features/customers/schema";
import { IMPORT_COLUMNS, MAX_IMPORT_ROWS } from "@/features/import/columns";
import { parseScheduleDaysFlexible } from "@/lib/dates";
import { phoneMatchKey } from "@/lib/phone";

export type ImportRowError = {
  row: number;
  message: string;
};

export type ImportResult = {
  error?: string;
  customersCreated: number;
  customersUpdated: number;
  dogsCreated: number;
  dogsUpdated: number;
  rowErrors: ImportRowError[];
};

const optionalTimeSchema = z
  .string()
  .optional()
  .transform((v) => v?.trim() ?? "")
  .refine((v) => !v || /^\d{1,2}:\d{2}(:\d{2})?$/.test(v), {
    message: "Time must be HH:MM",
  });

function normalizeTime(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  const parts = trimmed.split(":");
  const hour = parts[0]?.padStart(2, "0") ?? "08";
  const minute = parts[1]?.padStart(2, "0") ?? "00";
  return `${hour}:${minute}`;
}

function parseHikeRateCents(raw?: string): number | null {
  if (!raw?.trim()) return null;
  const n = Number.parseFloat(raw.replace(/[$,\s]/g, ""));
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

function hasCustomerFields(record: Record<string, string>): boolean {
  return Boolean(
    record.customer_owner_name ||
      record.customer_phone ||
      record.customer_address ||
      record.customer_email
  );
}

function validateCustomerRecord(
  record: Record<string, string>,
  rowNum: number
): { ok: true; data: z.infer<typeof customerSchema> } | { ok: false; error: ImportRowError } {
  const parsed = customerSchema.safeParse({
    owner_name: record.customer_owner_name,
    phone: record.customer_phone,
    email: record.customer_email || "",
    address: record.customer_address,
    secondary_owner_name: record.customer_secondary_owner_name || undefined,
    secondary_phone: record.customer_secondary_phone || undefined,
    notes: record.customer_notes || undefined,
    is_active: true,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: {
        row: rowNum,
        message: parsed.error.issues[0]?.message ?? "Invalid customer data",
      },
    };
  }

  return { ok: true, data: parsed.data };
}

function validateDogFields(
  record: Record<string, string>,
  rowNum: number
): { ok: true } | { ok: false; error: ImportRowError } {
  if (!record.dog_name?.trim()) {
    return {
      ok: false,
      error: { row: rowNum, message: "Dog name is required when adding a dog" },
    };
  }

  const start = optionalTimeSchema.safeParse(record.pickup_window_start || "08:00");
  if (!start.success) {
    return {
      ok: false,
      error: { row: rowNum, message: start.error.issues[0]?.message ?? "Invalid pickup start time" },
    };
  }

  const end = optionalTimeSchema.safeParse(record.pickup_window_end || "08:30");
  if (!end.success) {
    return {
      ok: false,
      error: { row: rowNum, message: end.error.issues[0]?.message ?? "Invalid pickup end time" },
    };
  }

  if (record.hike_rate?.trim()) {
    const cents = parseHikeRateCents(record.hike_rate);
    if (cents == null) {
      return {
        ok: false,
        error: { row: rowNum, message: "Hike rate must be a valid dollar amount" },
      };
    }
  }

  return { ok: true };
}

export function validateImportRecords(
  records: Record<string, string>[]
): { ok: true } | { ok: false; error: string; rowErrors: ImportRowError[] } {
  if (records.length === 0) {
    return { ok: false, error: "CSV has no data rows.", rowErrors: [] };
  }

  if (records.length > MAX_IMPORT_ROWS) {
    return {
      ok: false,
      error: `Import limited to ${MAX_IMPORT_ROWS} rows. Split your file and try again.`,
      rowErrors: [],
    };
  }

  const rowErrors: ImportRowError[] = [];

  records.forEach((record, index) => {
    const rowNum = index + 2;
    const hasDog = Boolean(record.dog_name?.trim());
    const hasCustomer = hasCustomerFields(record);

    if (!hasCustomer && !hasDog) {
      rowErrors.push({ row: rowNum, message: "Row is empty — add customer or dog data" });
      return;
    }

    if (!record.customer_phone?.trim()) {
      rowErrors.push({ row: rowNum, message: "Customer phone is required on every row" });
      return;
    }

    if (record.customer_phone.trim().length < 10) {
      rowErrors.push({ row: rowNum, message: "Valid customer phone required" });
      return;
    }

    if (hasCustomer) {
      if (!record.customer_owner_name?.trim()) {
        rowErrors.push({
          row: rowNum,
          message: "Customer owner name is required when adding customer details",
        });
        return;
      }

      if (!record.customer_address?.trim()) {
        rowErrors.push({
          row: rowNum,
          message: "Customer address is required when adding customer details",
        });
        return;
      }

      const customerResult = validateCustomerRecord(record, rowNum);
      if (!customerResult.ok) {
        rowErrors.push(customerResult.error);
        return;
      }
    }

    if (hasDog) {
      const dogResult = validateDogFields(record, rowNum);
      if (!dogResult.ok) {
        rowErrors.push(dogResult.error);
      }
    }
  });

  if (rowErrors.length > 0) {
    return {
      ok: false,
      error: `${rowErrors.length} row${rowErrors.length === 1 ? "" : "s"} need fixes before import.`,
      rowErrors,
    };
  }

  return { ok: true };
}

export function missingImportHeaders(headers: string[]): string[] {
  const required = ["customer_phone"];
  return required.filter((h) => !headers.includes(h));
}

export { IMPORT_COLUMNS, phoneMatchKey, parseHikeRateCents, normalizeTime, parseScheduleDaysFlexible, secondaryContactPayload };
