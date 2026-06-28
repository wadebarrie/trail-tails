"use server";

import { requireRole } from "@/features/auth/queries";
import type { ImportResult } from "@/features/import/validate";
import { runBulkImport } from "@/features/import/run-import";

export async function bulkImportAction(
  _prev: ImportResult | { error?: string },
  formData: FormData
): Promise<ImportResult> {
  const profile = await requireRole("admin");
  const csv = String(formData.get("csv") ?? "").trim();

  if (!csv) {
    return {
      error: "Choose a CSV file to import.",
      customersCreated: 0,
      customersUpdated: 0,
      dogsCreated: 0,
      dogsUpdated: 0,
      rowErrors: [],
    };
  }

  return runBulkImport(profile.company_id, csv);
}
