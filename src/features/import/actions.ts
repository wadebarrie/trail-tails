"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/features/auth/queries";
import type { ImportResult } from "@/features/import/validate";
import { runBulkImport } from "@/features/import/run-import";
import { safeAppReturnPath } from "@/lib/safe-return-path";
import { ONBOARDING_PATH } from "@/features/onboarding/constants";

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

  const result = await runBulkImport(profile.company_id, csv);
  const returnTo = safeAppReturnPath(
    formData.get("returnTo")?.toString(),
    ""
  );

  const importedSomething =
    result.customersCreated > 0 ||
    result.customersUpdated > 0 ||
    result.dogsCreated > 0 ||
    result.dogsUpdated > 0;

  // Clean onboarding return: only leave Import when something landed and there
  // was no fatal error. Row-level skips stay on the page for review.
  if (
    returnTo &&
    returnTo.startsWith(ONBOARDING_PATH) &&
    !result.error &&
    importedSomething &&
    result.rowErrors.length === 0
  ) {
    redirect(returnTo);
  }

  return result;
}
