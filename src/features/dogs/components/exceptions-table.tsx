"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { FormSubmitButton } from "@/features/admin/components/form-submit-button";
import { SecondaryButton } from "@/features/admin/components/ui";
import {
  deleteScheduleExceptionAction,
  updateScheduleExceptionAction,
} from "@/features/dogs/actions";
import { ExceptionFormFields } from "@/features/dogs/components/exception-form-fields";
import { formatExceptionDates } from "@/features/dogs/exception-utils";
import type { ExceptionType } from "@/types";

type DogOption = { id: string; name: string };

export type ScheduleExceptionRow = {
  id: string;
  dog_id: string;
  dogName: string;
  exception_type: ExceptionType;
  start_date: string;
  end_date: string | null;
  reason: string | null;
};

function EditExceptionRow({
  exception,
  dogs,
  onCancel,
}: {
  exception: ScheduleExceptionRow;
  dogs: DogOption[];
  onCancel: () => void;
}) {
  const boundUpdate = updateScheduleExceptionAction.bind(null, exception.id);
  const [state, formAction] = useActionState(boundUpdate, {});

  return (
    <tr className="bg-stone-50">
      <td colSpan={5} className="px-4 py-4">
        {state.error ? (
          <p
            className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}
        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          <ExceptionFormFields
            dogs={dogs}
            dogId={exception.dog_id}
            exceptionType={exception.exception_type}
            startDate={exception.start_date}
            endDate={exception.end_date ?? undefined}
            reason={exception.reason}
            idPrefix={exception.id}
          />
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <FormSubmitButton pendingLabel="Saving…">Save changes</FormSubmitButton>
            <SecondaryButton type="button" onClick={onCancel}>
              Cancel
            </SecondaryButton>
          </div>
        </form>
      </td>
    </tr>
  );
}

function ExceptionActions({
  exception,
  onEdit,
}: {
  exception: ScheduleExceptionRow;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const label = formatExceptionDates(
      exception.start_date,
      exception.end_date,
      exception.exception_type
    );
    const confirmed = window.confirm(
      `Delete this exception for ${exception.dogName} (${label})? The dog will be added back to the schedule for those dates.`
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteScheduleExceptionAction(exception.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        <SecondaryButton
          type="button"
          onClick={onEdit}
          disabled={pending}
          className="min-h-9 px-3 py-1.5 text-xs"
        >
          Edit
        </SecondaryButton>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 active:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Delete"}
        </button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export function ExceptionsTable({
  exceptions,
  dogs,
  addedId,
  updatedId,
}: {
  exceptions: ScheduleExceptionRow[];
  dogs: DogOption[];
  addedId?: string;
  updatedId?: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <table className="min-w-full text-sm">
      <thead className="bg-stone-50 text-left text-stone-500">
        <tr>
          <th className="px-4 py-3 font-medium">Dog</th>
          <th className="px-4 py-3 font-medium">Type</th>
          <th className="px-4 py-3 font-medium">Dates</th>
          <th className="px-4 py-3 font-medium">Reason</th>
          <th className="px-4 py-3 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-100">
        {exceptions.map((ex) => {
          const isNew = ex.id === addedId;
          const isUpdated = ex.id === updatedId;
          const isEditing = editingId === ex.id;

          if (isEditing) {
            return (
              <EditExceptionRow
                key={ex.id}
                exception={ex}
                dogs={dogs}
                onCancel={() => setEditingId(null)}
              />
            );
          }

          return (
            <tr
              key={ex.id}
              className={
                isNew
                  ? "bg-green-50 ring-1 ring-inset ring-green-200"
                  : isUpdated
                    ? "bg-blue-50 ring-1 ring-inset ring-blue-200"
                    : undefined
              }
            >
              <td className="px-4 py-3 font-medium">
                {ex.dogName}
                {isNew ? (
                  <span className="ml-2 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    New
                  </span>
                ) : isUpdated ? (
                  <span className="ml-2 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                    Updated
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3 text-stone-600">
                {ex.exception_type.replace("_", " ")}
              </td>
              <td className="px-4 py-3 text-stone-600">
                {formatExceptionDates(
                  ex.start_date,
                  ex.end_date,
                  ex.exception_type
                )}
              </td>
              <td className="px-4 py-3 text-stone-600">{ex.reason ?? "—"}</td>
              <td className="px-4 py-3">
                <ExceptionActions
                  exception={ex}
                  onEdit={() => setEditingId(ex.id)}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
