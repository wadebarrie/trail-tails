"use client";

import { useActionState } from "react";
import { FormSubmitButton } from "@/features/admin/components/form-submit-button";
import { createScheduleExceptionAction } from "@/features/dogs/actions";
import { ExceptionFormFields } from "@/features/dogs/components/exception-form-fields";

type DogOption = { id: string; name: string };

export function AddExceptionForm({ dogs }: { dogs: DogOption[] }) {
  const [state, formAction] = useActionState(createScheduleExceptionAction, {});

  return (
    <div className="mb-8 rounded-xl border border-stone-200 bg-white p-5">
      <h2 className="text-sm font-medium text-stone-900">Add exception</h2>

      {state.error ? (
        <p
          className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <form action={formAction} className="mt-4 grid gap-4 sm:grid-cols-2">
        <ExceptionFormFields dogs={dogs} />
        <div className="sm:col-span-2">
          <FormSubmitButton pendingLabel="Adding exception…">
            Add exception
          </FormSubmitButton>
        </div>
      </form>
    </div>
  );
}
