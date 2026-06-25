"use client";

import { useActionState } from "react";
import { createDogAction, updateDogAction } from "@/features/dogs/actions";
import { ScheduleDaysField } from "@/features/dogs/components/schedule-days-field";
import type { Customer, Dog, Route } from "@/types";

type DogFormProps = {
  customers: Pick<Customer, "id" | "owner_name">[];
  routes: Pick<Route, "id" | "name">[];
  dog?: Dog;
  scheduleDays?: number[];
};

export function DogForm({ customers, routes, dog, scheduleDays = [] }: DogFormProps) {
  const action = dog ? updateDogAction.bind(null, dog.id) : createDogAction;
  const [state, formAction, pending] = useActionState(action, {} as { error?: string });

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor="customer_id" className="block text-sm font-medium text-stone-700">
          Owner
        </label>
        <select
          id="customer_id"
          name="customer_id"
          defaultValue={dog?.customer_id}
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
        >
          <option value="">Select customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.owner_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="route_id" className="block text-sm font-medium text-stone-700">
          Route
        </label>
        <select
          id="route_id"
          name="route_id"
          defaultValue={dog?.route_id ?? ""}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
        >
          <option value="">Unassigned</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <Field label="Dog name" name="name" defaultValue={dog?.name} required />
      <Field label="Breed" name="breed" defaultValue={dog?.breed ?? ""} />

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Pickup window start"
          name="pickup_window_start"
          type="time"
          defaultValue={dog?.pickup_window_start ?? "08:00"}
          required
        />
        <Field
          label="Pickup window end"
          name="pickup_window_end"
          type="time"
          defaultValue={dog?.pickup_window_end ?? "08:30"}
          required
        />
      </div>

      <ScheduleDaysField defaultDays={scheduleDays} />

      <Field
        label="Hike rate ($)"
        name="hike_rate"
        type="number"
        step="0.01"
        min="0"
        placeholder="Uses company default if blank"
        defaultValue={
          dog?.hike_rate_cents != null
            ? (dog.hike_rate_cents / 100).toFixed(2)
            : ""
        }
      />

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-stone-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={dog?.notes ?? ""}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>

      {dog ? (
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            name="is_active"
            value="true"
            defaultChecked={dog.is_active}
          />
          Active
        </label>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-trail-700)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : dog ? "Update dog" : "Create dog"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
  step,
  min,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  step?: string;
  min?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        step={step}
        min={min}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
      />
    </div>
  );
}
