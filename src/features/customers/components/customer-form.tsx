"use client";

import { useActionState, type ComponentProps } from "react";
import {
  inputClassName,
  textareaClassName,
} from "@/features/admin/components/form-styles";
import {
  createCustomerAction,
  updateCustomerAction,
  type CustomerFormState,
  type CustomerFormValues,
} from "@/features/customers/actions";
import { SubmitButton } from "@/features/admin/components/ui";
import { customerAddressFormDefaults } from "@/lib/address";
import type { Customer } from "@/types";

type CustomerFormProps = {
  customer?: Customer;
  returnTo?: string;
};

function initialValues(customer?: Customer): CustomerFormValues {
  const addressDefaults = customer
    ? customerAddressFormDefaults(customer)
    : {
        address_line1: "",
        address_line2: "",
        city: "",
        state_province: "",
        postal_code: "",
      };

  return {
    owner_name: customer?.owner_name ?? "",
    phone: customer?.phone ?? "",
    secondary_owner_name: customer?.secondary_owner_name ?? "",
    secondary_phone: customer?.secondary_phone ?? "",
    email: customer?.email ?? "",
    address_line1: addressDefaults.address_line1,
    address_line2: addressDefaults.address_line2,
    city: addressDefaults.city,
    state_province: addressDefaults.state_province,
    postal_code: addressDefaults.postal_code,
    notes: customer?.notes ?? "",
    night_before_reminders_enabled:
      customer?.night_before_reminders_enabled ?? true,
    is_active: customer?.is_active ?? true,
  };
}

export function CustomerForm({ customer, returnTo }: CustomerFormProps) {
  const action = customer
    ? updateCustomerAction.bind(null, customer.id)
    : createCustomerAction;

  const [state, formAction, pending] = useActionState(
    action,
    {} as CustomerFormState
  );

  const values = state.values ?? initialValues(customer);

  return (
    <form
      key={state.revision ?? 0}
      action={formAction}
      className="max-w-lg space-y-4"
      noValidate
    >
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <Field
        label="Owner name"
        name="owner_name"
        defaultValue={values.owner_name}
        required
        autoComplete="name"
      />
      <Field
        label="Phone"
        name="phone"
        type="tel"
        inputMode="tel"
        defaultValue={values.phone}
        required
        autoComplete="tel"
        placeholder="+1 604 555 0100"
        hint="Include country/area code. At least 10 digits."
      />

      <div className="surface-card rounded-[var(--radius-surface)] p-4">
        <p className="text-sm font-medium text-stone-700">
          Second contact (optional)
        </p>
        <p className="mt-0.5 text-xs text-stone-500">
          For households with two parents — receives the same text updates.
        </p>
        <div className="mt-3 space-y-3">
          <Field
            label="Name"
            name="secondary_owner_name"
            defaultValue={values.secondary_owner_name}
            autoComplete="off"
          />
          <Field
            label="Phone"
            name="secondary_phone"
            type="tel"
            inputMode="tel"
            defaultValue={values.secondary_phone}
            autoComplete="tel"
            placeholder="+1 604 555 0101"
          />
        </div>
      </div>

      <Field
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        defaultValue={values.email}
        autoComplete="email"
        placeholder="name@example.com"
        hint="Optional. Must be a valid email if provided."
      />

      <div className="surface-card space-y-3 rounded-[var(--radius-surface)] p-4">
        <div>
          <p className="text-sm font-medium text-stone-700">Address</p>
          <p className="mt-0.5 text-xs text-stone-500">
            Used for maps, ETAs, and automatic driver arrival detection.
          </p>
        </div>
        <Field
          label="Address line 1"
          name="address_line1"
          defaultValue={values.address_line1}
          required
          autoComplete="address-line1"
          placeholder="123 Main St"
        />
        <Field
          label="Address line 2"
          name="address_line2"
          defaultValue={values.address_line2}
          autoComplete="address-line2"
          placeholder="Apt, suite, unit (optional)"
        />
        <Field
          label="City"
          name="city"
          defaultValue={values.city}
          required
          autoComplete="address-level2"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="State / province"
            name="state_province"
            defaultValue={values.state_province}
            required
            autoComplete="address-level1"
            placeholder="BC"
          />
          <Field
            label="Postal / ZIP"
            name="postal_code"
            defaultValue={values.postal_code}
            required
            autoComplete="postal-code"
            placeholder="V3M 1R2"
          />
        </div>
        {customer?.address_lat != null && customer.address_lng != null ? (
          <p className="text-xs text-green-700">
            GPS on file ({customer.address_lat.toFixed(5)},{" "}
            {customer.address_lng.toFixed(5)})
          </p>
        ) : customer ? (
          <p className="text-xs text-amber-700">
            No GPS on file — re-save after adding a Google Maps API key, or edit
            the address to geocode.
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-stone-700">
          Pickup instructions
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={values.notes}
          placeholder="Gate code, buzzer #, key location, parking, which door…"
          className={`mt-1 ${textareaClassName}`}
        />
        <p className="mt-1 text-xs text-stone-500">
          Shown to drivers on the driver app when they open this stop. Include
          anything needed to get the dog — gate codes, apartment buzzers, spare
          key spots, parking notes.
        </p>
      </div>
      <label className="flex items-start gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          name="night_before_reminders_enabled"
          value="true"
          defaultChecked={values.night_before_reminders_enabled}
          className="mt-0.5"
        />
        <span>
          <strong>Night-before reminder texts</strong>
          <span className="mt-0.5 block text-xs font-normal text-stone-500">
            Text the day before a scheduled pickup with the pickup window and
            driver name. Send time is set in company Settings. Customers can text
            STOP REMINDERS / START REMINDERS. ETA and pickup/drop-off texts still
            send.
          </span>
        </span>
      </label>
      {customer ? (
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            name="is_active"
            value="true"
            defaultChecked={values.is_active}
          />
          Active
        </label>
      ) : null}

      <SubmitButton pending={pending}>
        {customer ? "Save customer" : "Add customer"}
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
        autoComplete={autoComplete}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className={`mt-1 ${inputClassName}`}
      />
      {hint ? <p className="mt-1 text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}
