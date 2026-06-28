"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/features/auth/queries";
import { resolveCustomerCoordinates } from "@/lib/google-maps/geocode";
import {
  customerSchema,
  secondaryContactPayload,
  type CustomerFormData,
} from "@/features/customers/schema";

function parseCustomerForm(formData: FormData, mode: "create" | "update") {
  const raw = Object.fromEntries(formData);
  const withFlags: Record<string, unknown> = { ...raw };

  withFlags.night_before_reminders_enabled =
    formData.get("night_before_reminders_enabled") === "true";

  if (mode === "update") {
    withFlags.is_active = formData.get("is_active") === "true";
  }

  return customerSchema.safeParse(withFlags);
}

function customerInsertPayload(data: CustomerFormData) {
  return {
    owner_name: data.owner_name,
    phone: data.phone,
    ...secondaryContactPayload(data),
    email: data.email || null,
    address: data.address,
    notes: data.notes || null,
    is_active: data.is_active ?? true,
    night_before_reminders_enabled: data.night_before_reminders_enabled ?? true,
  };
}

export async function createCustomerAction(
  _prev: { error?: string },
  formData: FormData
) {
  const profile = await requireRole("admin");
  const parsed = parseCustomerForm(formData, "create");

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const coords = await resolveCustomerCoordinates(parsed.data.address);
  if (!coords.ok) return { error: coords.error };

  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert({
    company_id: profile.company_id,
    ...customerInsertPayload(parsed.data),
    address_lat: coords.lat,
    address_lng: coords.lng,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}

export async function updateCustomerAction(
  id: string,
  _prev: { error?: string },
  formData: FormData
) {
  await requireRole("admin");
  const parsed = parseCustomerForm(formData, "update");

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("customers")
    .select("address, address_lat, address_lng")
    .eq("id", id)
    .maybeSingle();

  const coords = await resolveCustomerCoordinates(parsed.data.address, existing);
  if (!coords.ok) return { error: coords.error };

  const { error } = await supabase
    .from("customers")
    .update({
      ...customerInsertPayload(parsed.data),
      address_lat: coords.lat,
      address_lng: coords.lng,
      is_active: parsed.data.is_active ?? true,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${id}`);
  redirect("/dashboard/customers");
}
