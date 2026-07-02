"use client";

import { DatePickerField } from "@/features/admin/components/date-picker-field";

type BillingDateRangeFilterProps = {
  start: string;
  end: string;
};

export function BillingDateRangeFilter({ start, end }: BillingDateRangeFilterProps) {
  return (
    <form method="get" className="mb-6 flex flex-wrap items-end gap-4">
      <div>
        <label htmlFor="start" className="block text-sm font-medium text-stone-700">
          From
        </label>
        <DatePickerField
          id="start"
          name="start"
          defaultValue={start}
          className="mt-1 w-auto min-w-[12rem]"
        />
      </div>
      <div>
        <label htmlFor="end" className="block text-sm font-medium text-stone-700">
          To
        </label>
        <DatePickerField
          id="end"
          name="end"
          defaultValue={end}
          className="mt-1 w-auto min-w-[12rem]"
        />
      </div>
      <button
        type="submit"
        className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
      >
        Apply
      </button>
    </form>
  );
}
