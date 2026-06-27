"use client";

import { useActionState } from "react";
import {
  createDriverAction,
  updateDriverAction,
} from "@/features/drivers/actions";
import { SubmitButton } from "@/features/admin/components/ui";
import type { Profile } from "@/types";

type DriverFormProps = {
  driver?: Pick<Profile, "id" | "full_name" | "phone" | "is_active">;
  email?: string | null;
};

export function DriverForm({ driver, email }: DriverFormProps) {
  const action = driver
    ? updateDriverAction.bind(null, driver.id)
    : createDriverAction;

  const [state, formAction, pending] = useActionState(action, {} as {
    error?: string;
  });

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <Field
        label="Full name"
        name="full_name"
        defaultValue={driver?.full_name}
        required
      />

      {driver ? (
        <div>
          <label className="block text-sm font-medium text-stone-700">
            Login email
          </label>
          <p className="mt-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-600">
            {email ?? "—"}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Email is tied to the driver&apos;s login and cannot be changed here.
          </p>
        </div>
      ) : (
        <>
          <Field
            label="Login email"
            name="email"
            type="email"
            required
            autoComplete="off"
          />
          <Field
            label="Temporary password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
          />
          <p className="-mt-2 text-xs text-stone-500">
            Share this with the driver so they can sign in at the driver app.
          </p>
        </>
      )}

      <Field
        label="Phone"
        name="phone"
        type="tel"
        defaultValue={driver?.phone ?? ""}
      />

      {driver ? (
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            name="is_active"
            value="true"
            defaultChecked={driver.is_active}
          />
          Active
        </label>
      ) : null}

      <SubmitButton pending={pending}>
        {driver ? "Update driver" : "Create driver"}
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
  autoComplete,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
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
        autoComplete={autoComplete}
        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5"
      />
    </div>
  );
}
