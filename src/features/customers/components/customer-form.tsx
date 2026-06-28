"use client";

import { useActionState } from "react";
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/features/customers/actions";
import { SubmitButton } from "@/features/admin/components/ui";
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

      <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-4">
        <p className="text-sm font-medium text-stone-700">Second contact (optional)</p>
        <p className="mt-0.5 text-xs text-stone-500">
          For households with two parents — receives the same text updates.
        </p>
        <div className="mt-3 space-y-3">
          <Field
            label="Name"
            name="secondary_owner_name"
            defaultValue={customer?.secondary_owner_name ?? ""}
          />
          <Field
            label="Phone"
            name="secondary_phone"
            defaultValue={customer?.secondary_phone ?? ""}
          />
        </div>
      </div>

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
      <label className="flex items-start gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          name="night_before_reminders_enabled"
          value="true"
          defaultChecked={customer?.night_before_reminders_enabled ?? true}
          className="mt-0.5"
        />
        <span>
          <strong>Night-before reminder texts</strong>
          <span className="mt-0.5 block text-xs font-normal text-stone-500">
            ~6 PM text the day before a scheduled pickup. ETA and pickup/drop-off
            texts are always sent. Customers can text STOP REMINDERS / START
            REMINDERS.
          </span>
        </span>
      </label>
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

      <SubmitButton pending={pending}>
        {customer ? "Update customer" : "Create customer"}
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
