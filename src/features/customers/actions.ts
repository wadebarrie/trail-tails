"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/features/auth/queries";
import { resolveCustomerCoordinates } from "@/lib/google-maps/geocode";

const customerSchema = z.object({
  owner_name: z.string().min(1, "Owner name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  notes: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
});

export async function createCustomerAction(
  _prev: { error?: string },
  formData: FormData
) {
  const profile = await requireRole("admin");
  const parsed = customerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const coords = await resolveCustomerCoordinates(parsed.data.address);
  if (!coords.ok) return { error: coords.error };

  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert({
    company_id: profile.company_id,
    owner_name: parsed.data.owner_name,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    address: parsed.data.address,
    address_lat: coords.lat,
    address_lng: coords.lng,
    notes: parsed.data.notes || null,
    is_active: parsed.data.is_active ?? true,
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
  const parsed = customerSchema.safeParse(Object.fromEntries(formData));

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
      owner_name: parsed.data.owner_name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      address: parsed.data.address,
      address_lat: coords.lat,
      address_lng: coords.lng,
      notes: parsed.data.notes || null,
      is_active: parsed.data.is_active ?? true,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${id}`);
  redirect("/dashboard/customers");
}
