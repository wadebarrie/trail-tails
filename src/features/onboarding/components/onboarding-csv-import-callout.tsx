import Link from "next/link";
import { ONBOARDING_PATH } from "@/features/onboarding/constants";
import { secondaryButtonClassName } from "@/features/admin/components/button-styles";

const TEMPLATE_HREF = "/api/import/template?examples=1";

type OnboardingCsvImportCalloutProps = {
  /** Wizard step to return to after import (usually route once customers+dogs exist). */
  returnStep?: "dog" | "route";
};

/**
 * Points first-run admins at bulk CSV import for customers + dogs.
 * Primary create flows stay as the main CTA; this is the spreadsheet path.
 */
export function OnboardingCsvImportCallout({
  returnStep = "route",
}: OnboardingCsvImportCalloutProps) {
  const returnTo = `${ONBOARDING_PATH}?step=${returnStep}`;
  const importHref = `/dashboard/import?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-700">
      <p className="font-medium text-stone-900">Already have a client list?</p>
      <p className="mt-1 text-stone-600">
        Download the example CSV (customers and dogs — leave route blank for
        now), fill it in, then upload. One row per dog; repeat the phone for
        multi-dog households.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={TEMPLATE_HREF}
          className={`${secondaryButtonClassName} rounded-xl px-4 py-2 text-sm`}
        >
          Download example template
        </a>
        <Link
          href={importHref}
          className={`${secondaryButtonClassName} rounded-xl px-4 py-2 text-sm`}
        >
          Bulk import CSV
        </Link>
      </div>
    </div>
  );
}
