"use client";

import { inputClassName } from "@/features/admin/components/form-styles";
import { useActionState } from "react";
import {
  createVehicleAction,
  updateVehicleAction,
} from "@/features/vehicles/actions";
import { SubmitButton } from "@/features/admin/components/ui";
import type { Vehicle } from "@/types";

type VehicleFormProps = {
  vehicle?: Vehicle;
};

export function VehicleForm({ vehicle }: VehicleFormProps) {
  const action = vehicle
    ? updateVehicleAction.bind(null, vehicle.id)
    : createVehicleAction;

  const [state, formAction] = useActionState(action, {} as { error?: string });

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <Field
        label="Name"
        name="name"
        defaultValue={vehicle?.name}
        required
        hint="e.g. Blue Van, Truck 2"
      />
      <Field
        label="License plate"
        name="plate"
        defaultValue={vehicle?.plate ?? ""}
        hint="Optional — helps drivers pick the right vehicle"
      />
      <Field
        label="Capacity (dogs)"
        name="capacity"
        type="number"
        defaultValue={
          vehicle?.capacity != null ? String(vehicle.capacity) : ""
        }
        hint="Optional — used later for overfill warnings"
      />

      {vehicle ? (
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            name="is_active"
            value="true"
            defaultChecked={vehicle.is_active}
            className="rounded border-stone-300"
          />
          Active
        </label>
      ) : null}

      <SubmitButton>{vehicle ? "Save vehicle" : "Add vehicle"}</SubmitButton>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  hint?: string;
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
        required={required}
        defaultValue={defaultValue}
        min={type === "number" ? 1 : undefined}
        className={`mt-1 ${inputClassName}`}
      />
      {hint ? <p className="mt-1 text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}
