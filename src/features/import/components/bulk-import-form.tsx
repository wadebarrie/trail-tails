"use client";

import { useActionState, useRef, useState } from "react";
import { bulkImportAction } from "@/features/import/actions";
import type { ImportResult } from "@/features/import/validate";
import { primaryButtonClassName } from "@/features/admin/components/button-styles";
import { IMPORT_COLUMN_LABELS, IMPORT_COLUMNS } from "@/features/import/columns";

const initialState: ImportResult = {
  customersCreated: 0,
  customersUpdated: 0,
  dogsCreated: 0,
  dogsUpdated: 0,
  rowErrors: [],
};

export function BulkImportForm() {
  const [state, formAction, pending] = useActionState(bulkImportAction, initialState);
  const [fileName, setFileName] = useState<string | null>(null);
  const csvRef = useRef<HTMLTextAreaElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName(null);
      if (csvRef.current) csvRef.current.value = "";
      return;
    }

    setFileName(file.name);
    const text = await file.text();
    if (csvRef.current) {
      csvRef.current.value = text;
    }
  }

  const hasResults =
    state.customersCreated > 0 ||
    state.customersUpdated > 0 ||
    state.dogsCreated > 0 ||
    state.dogsUpdated > 0;

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label
          htmlFor="csv_file"
          className="block text-sm font-medium text-stone-700"
        >
          CSV file
        </label>
        <input
          id="csv_file"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="mt-2 block w-full text-sm text-stone-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--color-trail-700)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[var(--color-trail-800)]"
        />
        {fileName ? (
          <p className="mt-2 text-sm text-stone-500">Selected: {fileName}</p>
        ) : null}
        <textarea
          ref={csvRef}
          name="csv"
          hidden
          readOnly
          aria-hidden
          tabIndex={-1}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className={primaryButtonClassName}
      >
        {pending ? "Importing…" : "Import CSV"}
      </button>

      {state.error ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {state.error}
        </div>
      ) : null}

      {hasResults ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-medium">Import complete</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {state.customersCreated > 0 ? (
              <li>{state.customersCreated} customer(s) created</li>
            ) : null}
            {state.customersUpdated > 0 ? (
              <li>{state.customersUpdated} customer(s) updated</li>
            ) : null}
            {state.dogsCreated > 0 ? (
              <li>{state.dogsCreated} dog(s) created</li>
            ) : null}
            {state.dogsUpdated > 0 ? (
              <li>{state.dogsUpdated} dog(s) updated</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {state.rowErrors.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">
            {state.rowErrors.length} row
            {state.rowErrors.length === 1 ? "" : "s"} skipped
          </p>
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto font-mono text-xs">
            {state.rowErrors.map((err) => (
              <li key={`${err.row}-${err.message}`}>
                Row {err.row}: {err.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </form>
  );
}

export function ImportColumnReference() {
  return (
    <dl className="divide-y divide-stone-100 text-sm">
      {IMPORT_COLUMNS.map((column) => (
        <div key={column} className="grid gap-1 py-2 sm:grid-cols-2">
          <dt className="font-mono text-xs text-stone-600">{column}</dt>
          <dd className="text-stone-700">{IMPORT_COLUMN_LABELS[column]}</dd>
        </div>
      ))}
    </dl>
  );
}
