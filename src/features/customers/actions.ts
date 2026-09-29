"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/features/auth/queries";
import {
  coerceStructuredCustomerAddress,
  formatCustomerAddress,
} from "@/lib/address";
import { resolveCustomerCoordinates } from "@/lib/google-maps/geocode";
import {
  customerSchema,
  secondaryContactPayload,
  type CustomerFormData,
} from "@/features/customers/schema";
import { safeAppReturnPath } from "@/lib/safe-return-path";

export type CustomerFormValues = {
  owner_name: string;
  phone: string;
  secondary_owner_name: string;
  secondary_phone: string;
  email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state_province: string;
  postal_code: string;
  notes: string;
  night_before_reminders_enabled: boolean;
  is_active: boolean;
};

export type CustomerFormState = {
  error?: string;
  /** Form field name to focus after an error (e.g. state_province). */
  field?: string;
  values?: CustomerFormValues;
  /** Bumps so the client remounts inputs with preserved values after an error. */
  revision?: number;
};

function fieldString(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function extractCustomerFormValues(formData: FormData): CustomerFormValues {
  return {
    owner_name: fieldString(formData, "owner_name"),
    phone: fieldString(formData, "phone"),
    secondary_owner_name: fieldString(formData, "secondary_owner_name"),
    secondary_phone: fieldString(formData, "secondary_phone"),
    email: fieldString(formData, "email"),
    address_line1: fieldString(formData, "address_line1"),
    address_line2: fieldString(formData, "address_line2"),
    city: fieldString(formData, "city"),
    state_province: fieldString(formData, "state_province"),
    postal_code: fieldString(formData, "postal_code"),
    notes: fieldString(formData, "notes"),
    night_before_reminders_enabled:
      formData.get("night_before_reminders_enabled") === "true",
    is_active: formData.get("is_active") === "true",
  };
}

function formError(
  prev: CustomerFormState,
  formData: FormData,
  error: string,
  field?: string
): CustomerFormState {
  return {
    error,
    field,
    values: extractCustomerFormValues(formData),
    revision: (prev.revision ?? 0) + 1,
  };
}

function firstIssueField(
  issues: { path: (string | number)[] }[]
): string | undefined {
  const path = issues[0]?.path;
  if (!path?.length) return undefined;
  const name = path[0];
  return typeof name === "string" ? name : undefined;
}

function parseCustomerForm(formData: FormData, mode: "create" | "update") {
  const raw = Object.fromEntries(formData);
  const withFlags: Record<string, unknown> = { ...raw };

  withFlags.night_before_reminders_enabled =
    formData.get("night_before_reminders_enabled") === "true";

  if (mode === "update") {
    withFlags.is_active = formData.get("is_active") === "true";
  }

  const coerced = coerceStructuredCustomerAddress({
    address_line1: String(withFlags.address_line1 ?? ""),
    address_line2: String(withFlags.address_line2 ?? ""),
    city: String(withFlags.city ?? ""),
    state_province: String(withFlags.state_province ?? ""),
    postal_code: String(withFlags.postal_code ?? ""),
  });
  Object.assign(withFlags, coerced);

  return customerSchema.safeParse(withFlags);
}

function customerInsertPayload(data: CustomerFormData) {
  const composed = formatCustomerAddress(data);
  return {
    owner_name: data.owner_name,
    phone: data.phone,
    ...secondaryContactPayload(data),
    email: data.email || null,
    address_line1: data.address_line1,
    address_line2: data.address_line2?.trim() || null,
    city: data.city,
    state_province: data.state_province,
    postal_code: data.postal_code,
    address: composed,
    notes: data.notes || null,
    is_active: data.is_active ?? true,
    night_before_reminders_enabled: data.night_before_reminders_enabled ?? true,
  };
}

export async function createCustomerAction(
  prev: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const profile = await requireRole("admin");
  const parsed = parseCustomerForm(formData, "create");

  if (!parsed.success) {
    return formError(
      prev,
      formData,
      parsed.error.issues[0]?.message ?? "Invalid input",
      firstIssueField(parsed.error.issues)
    );
  }

  const composed = formatCustomerAddress(parsed.data);
  const coords = await resolveCustomerCoordinates(composed);
  if (!coords.ok) {
    return formError(prev, formData, coords.error, "address_line1");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert({
    company_id: profile.company_id,
    ...customerInsertPayload(parsed.data),
    address_lat: coords.lat,
    address_lng: coords.lng,
  });

  if (error) return formError(prev, formData, error.message);

  revalidatePath("/dashboard/customers");
  redirect(
    safeAppReturnPath(
      formData.get("returnTo")?.toString(),
      "/dashboard/customers"
    )
  );
}

export async function updateCustomerAction(
  id: string,
  prev: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  await requireRole("admin");
  const parsed = parseCustomerForm(formData, "update");

  if (!parsed.success) {
    return formError(
      prev,
      formData,
      parsed.error.issues[0]?.message ?? "Invalid input",
      firstIssueField(parsed.error.issues)
    );
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("customers")
    .select("address, address_lat, address_lng")
    .eq("id", id)
    .maybeSingle();

  const composed = formatCustomerAddress(parsed.data);
  const coords = await resolveCustomerCoordinates(composed, existing);
  if (!coords.ok) {
    return formError(prev, formData, coords.error, "address_line1");
  }

  const { error } = await supabase
    .from("customers")
    .update({
      ...customerInsertPayload(parsed.data),
      address_lat: coords.lat,
      address_lng: coords.lng,
      is_active: parsed.data.is_active ?? true,
    })
    .eq("id", id);

  if (error) return formError(prev, formData, error.message);

  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${id}`);
  redirect("/dashboard/customers");
}
