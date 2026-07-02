import { revalidatePath } from "next/cache";
import { syncStopsForTodayAndTomorrow } from "@/features/hikes/sync-stops";
import { createClient } from "@/lib/supabase/server";
import { resolveCustomerCoordinates } from "@/lib/google-maps/geocode";
import { csvToRecords, parseCsv } from "@/lib/csv";
import { phoneMatchKey } from "@/lib/phone";
import type { ImportResult } from "@/features/import/validate";
import {
  missingImportHeaders,
  normalizeTime,
  parseHikeRateCents,
  parseScheduleDaysFlexible,
  secondaryContactPayload,
  validateImportRecords,
} from "@/features/import/validate";

type ExistingCustomer = {
  id: string;
  phone: string;
  owner_name: string;
  address: string;
  address_lat: number | null;
  address_lng: number | null;
};

type ExistingDog = {
  id: string;
  customer_id: string;
  name: string;
};

export async function runBulkImport(
  companyId: string,
  csvText: string
): Promise<ImportResult> {
  const rows = parseCsv(csvText);
  const { headers, records } = csvToRecords(rows);

  const missing = missingImportHeaders(headers);
  if (missing.length > 0) {
    return {
      error: `Missing required column: ${missing.join(", ")}. Download the template and try again.`,
      customersCreated: 0,
      customersUpdated: 0,
      dogsCreated: 0,
      dogsUpdated: 0,
      rowErrors: [],
    };
  }

  const validation = validateImportRecords(records);
  if (!validation.ok) {
    return {
      error: validation.error,
      customersCreated: 0,
      customersUpdated: 0,
      dogsCreated: 0,
      dogsUpdated: 0,
      rowErrors: validation.rowErrors,
    };
  }

  const supabase = await createClient();

  const [{ data: existingCustomers }, { data: existingDogs }, { data: routes }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, phone, owner_name, address, address_lat, address_lng")
        .eq("company_id", companyId),
      supabase
        .from("dogs")
        .select("id, customer_id, name")
        .eq("company_id", companyId),
      supabase.from("routes").select("id, name").eq("company_id", companyId),
    ]);

  const customerByPhone = new Map<string, ExistingCustomer>();
  for (const customer of existingCustomers ?? []) {
    customerByPhone.set(phoneMatchKey(customer.phone), customer);
  }

  const dogByCustomerAndName = new Map<string, ExistingDog>();
  for (const dog of existingDogs ?? []) {
    dogByCustomerAndName.set(
      `${dog.customer_id}:${dog.name.trim().toLowerCase()}`,
      dog
    );
  }

  const routeByName = new Map<string, string>();
  for (const route of routes ?? []) {
    routeByName.set(route.name.trim().toLowerCase(), route.id);
  }

  const result: ImportResult = {
    customersCreated: 0,
    customersUpdated: 0,
    dogsCreated: 0,
    dogsUpdated: 0,
    rowErrors: [],
  };

  const pendingCustomerByPhone = new Map<string, string>();

  for (let index = 0; index < records.length; index++) {
    const record = records[index];
    const rowNum = index + 2;
    const phoneKey = phoneMatchKey(record.customer_phone);

    try {
      let customerId = pendingCustomerByPhone.get(phoneKey);
      const existingCustomer = customerByPhone.get(phoneKey);

      const hasNewCustomerData =
        record.customer_owner_name?.trim() &&
        record.customer_address?.trim();

      if (hasNewCustomerData) {
        const coords = await resolveCustomerCoordinates(
          record.customer_address,
          existingCustomer
        );

        if (!coords.ok) {
          result.rowErrors.push({ row: rowNum, message: coords.error });
          continue;
        }

        const customerPayload = {
          owner_name: record.customer_owner_name.trim(),
          phone: record.customer_phone.trim(),
          ...secondaryContactPayload({
            owner_name: record.customer_owner_name,
            phone: record.customer_phone,
            email: record.customer_email || "",
            address: record.customer_address,
            secondary_owner_name: record.customer_secondary_owner_name || undefined,
            secondary_phone: record.customer_secondary_phone || undefined,
            notes: record.customer_notes || undefined,
          }),
          email: record.customer_email?.trim() || null,
          address: record.customer_address.trim(),
          address_lat: coords.lat,
          address_lng: coords.lng,
          notes: record.customer_notes?.trim() || null,
          is_active: true,
        };

        if (existingCustomer) {
          const { error } = await supabase
            .from("customers")
            .update(customerPayload)
            .eq("id", existingCustomer.id);

          if (error) {
            result.rowErrors.push({ row: rowNum, message: error.message });
            continue;
          }

          customerId = existingCustomer.id;
          result.customersUpdated++;
          customerByPhone.set(phoneKey, {
            ...existingCustomer,
            ...customerPayload,
            address_lat: coords.lat,
            address_lng: coords.lng,
          });
        } else {
          const { data: inserted, error } = await supabase
            .from("customers")
            .insert({ company_id: companyId, ...customerPayload })
            .select("id, phone, owner_name, address, address_lat, address_lng")
            .single();

          if (error || !inserted) {
            result.rowErrors.push({
              row: rowNum,
              message: error?.message ?? "Failed to create customer",
            });
            continue;
          }

          customerId = inserted.id;
          result.customersCreated++;
          customerByPhone.set(phoneKey, inserted);
        }
      } else if (existingCustomer) {
        customerId = existingCustomer.id;
      }

      if (!customerId) {
        result.rowErrors.push({
          row: rowNum,
          message:
            "Customer not found — include owner name and address on the first row for this phone number",
        });
        continue;
      }

      pendingCustomerByPhone.set(phoneKey, customerId);

      if (!record.dog_name?.trim()) {
        continue;
      }

      const routeName = record.route_name?.trim().toLowerCase() ?? "";
      let routeId: string | null = null;
      if (routeName) {
        routeId = routeByName.get(routeName) ?? null;
        if (!routeId) {
          result.rowErrors.push({
            row: rowNum,
            message: `Route "${record.route_name}" not found — create it first or leave blank`,
          });
          continue;
        }
      }

      const dogName = record.dog_name.trim();
      const dogKey = `${customerId}:${dogName.toLowerCase()}`;
      const existingDog = dogByCustomerAndName.get(dogKey);
      const scheduleDays = parseScheduleDaysFlexible(record.schedule_days);
      const pickupStart = normalizeTime(record.pickup_window_start, "08:00");
      const pickupEnd = normalizeTime(record.pickup_window_end, "08:30");

      const dogPayload = {
        customer_id: customerId,
        route_id: routeId,
        name: dogName,
        breed: record.dog_breed?.trim() || null,
        notes: record.dog_notes?.trim() || null,
        pickup_window_start: pickupStart,
        pickup_window_end: pickupEnd,
        hike_rate_cents: parseHikeRateCents(record.hike_rate),
        is_active: true,
      };

      if (existingDog) {
        const { error } = await supabase
          .from("dogs")
          .update(dogPayload)
          .eq("id", existingDog.id);

        if (error) {
          result.rowErrors.push({ row: rowNum, message: error.message });
          continue;
        }

        await supabase
          .from("dog_schedule_days")
          .delete()
          .eq("dog_id", existingDog.id);

        if (scheduleDays.length > 0) {
          await supabase.from("dog_schedule_days").insert(
            scheduleDays.map((day_of_week) => ({
              dog_id: existingDog.id,
              day_of_week,
            }))
          );
        }

        result.dogsUpdated++;
      } else {
        const sortOrder =
          routeId != null
            ? ((
                await supabase
                  .from("dogs")
                  .select("*", { count: "exact", head: true })
                  .eq("route_id", routeId)
              ).count ?? 0)
            : 0;

        const { data: inserted, error } = await supabase
          .from("dogs")
          .insert({
            company_id: companyId,
            ...dogPayload,
            route_sort_order: sortOrder,
          })
          .select("id, customer_id, name")
          .single();

        if (error || !inserted) {
          result.rowErrors.push({
            row: rowNum,
            message: error?.message ?? "Failed to create dog",
          });
          continue;
        }

        if (scheduleDays.length > 0) {
          await supabase.from("dog_schedule_days").insert(
            scheduleDays.map((day_of_week) => ({
              dog_id: inserted.id,
              day_of_week,
            }))
          );
        }

        dogByCustomerAndName.set(dogKey, inserted);
        result.dogsCreated++;
      }
    } catch (err) {
      result.rowErrors.push({
        row: rowNum,
        message: err instanceof Error ? err.message : "Unexpected error",
      });
    }
  }

  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/dogs");
  revalidatePath("/dashboard/import");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  revalidatePath("/today");
  revalidatePath("/tomorrow");

  if (result.dogsCreated > 0 || result.customersCreated > 0) {
    await syncStopsForTodayAndTomorrow(companyId);
  }

  return result;
}
