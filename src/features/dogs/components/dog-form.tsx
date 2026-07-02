"use client";

import { useActionState, useState } from "react";
import { createDogAction, updateDogAction } from "@/features/dogs/actions";
import { SubmitButton } from "@/features/admin/components/ui";
import { ScheduleDaysField } from "@/features/dogs/components/schedule-days-field";
import { ScheduleTypeField } from "@/features/dogs/components/schedule-type-field";
import type { Customer, Dog, DogScheduleType, Route } from "@/types";

type DogFormProps = {
  customers: Pick<Customer, "id" | "owner_name">[];
  routes: Pick<Route, "id" | "name">[];
  dog?: Dog;
  scheduleDays?: number[];
};

export function DogForm({ customers, routes, dog, scheduleDays = [] }: DogFormProps) {
  const action = dog ? updateDogAction.bind(null, dog.id) : createDogAction;
  const [state, formAction, pending] = useActionState(action, {} as { error?: string });
  const [scheduleType, setScheduleType] = useState<DogScheduleType>(
    dog?.schedule_type ?? "recurring"
  );
  const [hasDropoffWindow, setHasDropoffWindow] = useState(
    Boolean(dog?.dropoff_window_start && dog?.dropoff_window_end)
  );
  const isAsNeeded = scheduleType === "as_needed";

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

      <ScheduleTypeField value={scheduleType} onChange={setScheduleType} />

      {!isAsNeeded ? (
        <div>
          <label htmlFor="walk_period" className="block text-sm font-medium text-stone-700">
            Walks per day
          </label>
          <select
            id="walk_period"
            name="walk_period"
            defaultValue={dog?.walk_period ?? "morning"}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          >
            <option value="morning">Morning only</option>
            <option value="afternoon">Afternoon only</option>
            <option value="both">Morning and afternoon</option>
          </select>
          <p className="mt-1 text-xs text-stone-500">
            For routes that run twice daily, choose which walk(s) this dog is on.
          </p>
        </div>
      ) : null}

      {!isAsNeeded ? (
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
      ) : null}

      <Field label="Dog name" name="name" defaultValue={dog?.name} required />
      <Field label="Breed" name="breed" defaultValue={dog?.breed ?? ""} />

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Default pickup window start"
          name="pickup_window_start"
          type="time"
          defaultValue={dog?.pickup_window_start ?? "08:00"}
          required
        />
        <Field
          label="Default pickup window end"
          name="pickup_window_end"
          type="time"
          defaultValue={dog?.pickup_window_end ?? "08:30"}
          required
        />
      </div>
      <p className="-mt-2 text-xs text-stone-500">
        Starting point when building a daily route plan. Adjust planned ETAs on
        the Today or Tomorrow pages.
      </p>

      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          name="use_dropoff_window"
          value="true"
          checked={hasDropoffWindow}
          onChange={(e) => setHasDropoffWindow(e.target.checked)}
        />
        Set drop-off window
      </label>
      {hasDropoffWindow ? (
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Drop-off window start"
            name="dropoff_window_start"
            type="time"
            defaultValue={dog?.dropoff_window_start?.slice(0, 5) ?? "15:00"}
          />
          <Field
            label="Drop-off window end"
            name="dropoff_window_end"
            type="time"
            defaultValue={dog?.dropoff_window_end?.slice(0, 5) ?? "15:30"}
          />
        </div>
      ) : null}
      <p className="-mt-2 text-xs text-stone-500">
        Optional. Most companies leave afternoon drop-offs flexible with no
        planned window.
      </p>

      {!isAsNeeded ? <ScheduleDaysField defaultDays={scheduleDays} /> : null}

      {isAsNeeded ? (
        <p className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600">
          As-needed dogs are booked onto specific days from the Today or Tomorrow
          pages. That daily route plan does not change their profile.
        </p>
      ) : null}

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

      <SubmitButton pending={pending}>
        {dog ? "Update dog" : "Create dog"}
      </SubmitButton>
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
