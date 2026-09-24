"use client";

import { useActionState, type ComponentProps } from "react";
import { inputClassName } from "@/features/admin/components/form-styles";
import {
  createDriverAction,
  updateDriverAction,
} from "@/features/drivers/actions";
import { SubmitButton } from "@/features/admin/components/ui";
import type { Profile } from "@/types";

type DriverFormProps = {
  driver?: Pick<
    Profile,
    "id" | "full_name" | "phone" | "is_active" | "role" | "can_drive"
  >;
  email?: string | null;
  returnTo?: string;
};

export function DriverForm({ driver, email, returnTo }: DriverFormProps) {
  const action = driver
    ? updateDriverAction.bind(null, driver.id)
    : createDriverAction;

  const [state, formAction, pending] = useActionState(action, {} as {
    error?: string;
  });

  const isAdminDriver = driver?.role === "admin";

  return (
    <form action={formAction} className="max-w-lg space-y-4" noValidate>
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
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
            {isAdminDriver
              ? "This is the same email used for the admin dashboard and driver app."
              : "Email is tied to the driver’s login and cannot be changed here."}
          </p>
        </div>
      ) : (
        <>
          <Field
            label="Login email"
            name="email"
            type="email"
            inputMode="email"
            required
            autoComplete="off"
            placeholder="driver@example.com"
          />
          <Field
            label="Temporary password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
          />
          <p className="-mt-2 text-xs text-stone-500">
            Share this with the driver so they can sign in. If the email belongs
            to a company admin, we enable driver access on that existing login
            instead of creating a second account.
          </p>
        </>
      )}

      <Field
        label="Phone"
        name="phone"
        type="tel"
        inputMode="tel"
        defaultValue={driver?.phone ?? ""}
        placeholder="+1 604 555 0100"
        hint="Optional. At least 10 digits if provided."
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

      {isAdminDriver ? (
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            name="can_drive"
            value="true"
            defaultChecked={driver.can_drive}
          />
          Also drives (same login for Driver view / Today)
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
  inputMode,
  autoComplete,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  inputMode?: ComponentProps<"input">["inputMode"];
  autoComplete?: string;
  placeholder?: string;
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
        inputMode={inputMode}
        defaultValue={defaultValue}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`mt-1 ${inputClassName}`}
      />
      {hint ? <p className="mt-1 text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}
