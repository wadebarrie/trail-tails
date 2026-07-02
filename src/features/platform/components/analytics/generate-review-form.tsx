"use client";

import { useRouter } from "next/navigation";
import { MonthPickerField } from "@/features/admin/components/month-picker-field";
import type { CompanyUsageRow } from "@/features/platform/analytics/types";

export function GenerateReviewForm({
  companies,
  defaultMonth,
}: {
  companies: CompanyUsageRow[];
  defaultMonth: string;
}) {
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const companyId = String(formData.get("company_id") ?? "");
    const month = String(formData.get("month") ?? "");
    if (companyId && month) {
      router.push(`/owner/reviews/${companyId}/${month}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="company_id" className="block text-sm font-medium text-stone-700">
          Company
        </label>
        <select
          id="company_id"
          name="company_id"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
        >
          <option value="">Select…</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="month" className="block text-sm font-medium text-stone-700">
          Month
        </label>
        <MonthPickerField
          id="month"
          name="month"
          required
          defaultValue={defaultMonth}
          className="mt-1"
        />
      </div>
      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--color-trail-700)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-trail-800)]"
      >
        Generate
      </button>
    </form>
  );
}
