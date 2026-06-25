"use client";

import { useActionState } from "react";
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/features/customers/actions";
import type { Customer } from "@/types";

type CustomerFormProps = {
  customer?: Customer;
};

export function CustomerForm({ customer }: CustomerFormProps) {
  const action = customer
    ? updateCustomerAction.bind(null, customer.id)
    : createCustomerAction;

  const [state, formAction, pending] = useActionState(action, {} as { error?: string });

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <Field label="Owner name" name="owner_name" defaultValue={customer?.owner_name} required />
      <Field label="Phone" name="phone" defaultValue={customer?.phone} required />
      <Field label="Email" name="email" type="email" defaultValue={customer?.email ?? ""} />
      <div>
        <Field label="Address" name="address" defaultValue={customer?.address} required />
        <p className="mt-1 text-xs text-stone-500">
          Saved with GPS coordinates for automatic driver arrival detection.
        </p>
        {customer?.address_lat != null && customer.address_lng != null ? (
          <p className="mt-1 text-xs text-green-700">
            GPS on file ({customer.address_lat.toFixed(5)},{" "}
            {customer.address_lng.toFixed(5)})
          </p>
        ) : customer ? (
          <p className="mt-1 text-xs text-amber-700">
            No GPS on file — re-save after adding a Google Maps API key, or edit
            the address to geocode.
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-stone-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={customer?.notes ?? ""}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>
      {customer ? (
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            name="is_active"
            value="true"
            defaultChecked={customer.is_active}
          />
          Active
        </label>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-trail-700)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : customer ? "Update customer" : "Create customer"}
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
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
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
        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
      />
    </div>
  );
}
