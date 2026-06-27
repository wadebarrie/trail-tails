"use client";

import { useActionState } from "react";
import { FormSubmitButton } from "@/features/admin/components/form-submit-button";
import { createScheduleExceptionAction } from "@/features/dogs/actions";

const inputClassName =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:border-[var(--color-trail-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-trail-600)]/20";

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
        <div>
          <label htmlFor="dog_id" className="block text-sm text-stone-600">
            Dog
          </label>
          <select id="dog_id" name="dog_id" required className={inputClassName}>
            <option value="">Select dog</option>
            {dogs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="exception_type" className="block text-sm text-stone-600">
            Type
          </label>
          <select
            id="exception_type"
            name="exception_type"
            className={inputClassName}
          >
            <option value="skip_date">Skip date</option>
            <option value="vacation">Vacation</option>
            <option value="pause">Pause</option>
          </select>
        </div>
        <div>
          <label htmlFor="start_date" className="block text-sm text-stone-600">
            Start date
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="end_date" className="block text-sm text-stone-600">
            End date (optional for pause)
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            className={inputClassName}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="reason" className="block text-sm text-stone-600">
            Reason
          </label>
          <input id="reason" name="reason" className={inputClassName} />
        </div>
        <div className="sm:col-span-2">
          <FormSubmitButton pendingLabel="Adding exception…">
            Add exception
          </FormSubmitButton>
        </div>
      </form>
    </div>
  );
}
