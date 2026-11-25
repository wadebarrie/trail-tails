"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/features/auth/queries";
import { ONBOARDING_PATH } from "@/features/onboarding/constants";
import {
  sampleReminderPreview,
  sampleTextRecipient,
} from "@/features/onboarding/first-value";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { passwordSchema } from "@/lib/password";
import { logError } from "@/lib/logger";
import { digitsOnly } from "@/lib/phone";
import { COMMON_TIMEZONES } from "@/features/platform/timezones";
import { recordProductEvent } from "@/features/onboarding/product-events";
import {
  friendlySignupError,
  SIGNUP_GENERIC_ERROR,
} from "@/features/onboarding/signup-polish";
import { areInvitesEnabled, isSelfSignupEnabled } from "@/features/platform/settings";
import {
  abandonSelfSignup,
  requestSelfSignup,
  resendSelfSignup,
  type SelfSignupResult,
} from "@/features/onboarding/self-signup.server";
import {
  parseVehicleCapacity,
  vehicleSchema,
} from "@/features/vehicles/schema";
import {
  customerSchema,
} from "@/features/customers/schema";
import { formatCustomerAddress } from "@/lib/address";
import { resolveCustomerCoordinates } from "@/lib/google-maps/geocode";
import { createRouteAction } from "@/features/routes/actions";
import { nextInvoiceNumber } from "@/features/invoices/queries";
import { getDateInTimezone } from "@/lib/dates";
import { sendSms } from "@/lib/twilio";
import {
  HIKE_PHOTOS_BUCKET,
  PHOTO_MAX_BYTES,
  buildPhotoStoragePath,
  isUuid,
} from "@/features/hike-photos/constants";
import { buildGalleryUrl, generateShareToken } from "@/features/hike-photos/share";
import { randomUUID } from "node:crypto";

const timezoneValues = new Set<string>(COMMON_TIMEZONES.map((zone) => zone.value));

export type SignupFormValues = {
  company_name: string;
  timezone: string;
  admin_full_name: string;
  admin_email: string;
  admin_phone: string;
  province: string;
  password: string;
  password_confirm: string;
};

const selfSignupSchema = z
  .object({
    company_name: z.string().trim().min(1, "Company name is required."),
    timezone: z.string().min(1, "Timezone is required."),
    admin_full_name: z.string().trim().min(1, "Your name is required."),
    admin_email: z.string().trim().email("Enter a valid email."),
    admin_phone: z.string().optional(),
    province: z.string().optional(),
    password: passwordSchema,
    password_confirm: z.string().min(1, "Confirm your password."),
  })
  .superRefine((data, ctx) => {
    if (!timezoneValues.has(data.timezone)) {
      ctx.addIssue({
        code: "custom",
        message: "Choose a timezone from the list.",
        path: ["timezone"],
      });
    }
    const phone = data.admin_phone?.trim() ?? "";
    if (phone && digitsOnly(phone).length < 10) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a mobile number with at least 10 digits, or leave it blank.",
        path: ["admin_phone"],
      });
    }
    if (data.password !== data.password_confirm) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match.",
        path: ["password_confirm"],
      });
    }
  });

function signupValues(formData: FormData): SignupFormValues {
  return {
    company_name: formData.get("company_name")?.toString() ?? "",
    timezone: formData.get("timezone")?.toString() ?? "America/Vancouver",
    admin_full_name: formData.get("admin_full_name")?.toString() ?? "",
    admin_email: formData.get("admin_email")?.toString() ?? "",
    admin_phone: formData.get("admin_phone")?.toString() ?? "",
    province: formData.get("province")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
    password_confirm: formData.get("password_confirm")?.toString() ?? "",
  };
}

function fieldErrorsFromZod(error: z.ZodError): Partial<Record<keyof SignupFormValues, string>> {
  const fields: Partial<Record<keyof SignupFormValues, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in fields)) {
      fields[key as keyof SignupFormValues] = issue.message;
    }
  }
  return fields;
}

function signupFailure(
  prev: SelfSignupResult | { error?: string; revision?: number },
  formData: FormData,
  error: string,
  fieldErrors?: Partial<Record<keyof SignupFormValues, string>>
): SelfSignupResult {
  const friendly = friendlySignupError(error);
  if (friendly !== error.trim()) {
    logError("system", "Self-signup failed", { context: { raw: error } });
  }
  return {
    ok: false,
    error: friendly,
    fieldErrors,
    values: signupValues(formData),
    revision: ("revision" in prev ? prev.revision ?? 0 : 0) + 1,
  };
}

export type { SelfSignupResult };

export async function selfSignupAction(
  _prev: SelfSignupResult | { error?: string },
  formData: FormData
): Promise<SelfSignupResult> {
  try {
    if (!(await areInvitesEnabled())) {
      return {
        ok: false,
        error:
          "New signups are temporarily paused. Contact PackRoute support for help.",
      };
    }

    if (!(await isSelfSignupEnabled())) {
      return {
        ok: false,
        error:
          "Self-serve signup is not open yet. Ask PackRoute for an invite link.",
      };
    }

    const parsed = selfSignupSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      const fieldErrors = fieldErrorsFromZod(parsed.error);
      const first = parsed.error.issues[0]?.message ?? "Check the highlighted fields.";
      return signupFailure(_prev, formData, first, fieldErrors);
    }

    const result = await requestSelfSignup({
      companyName: parsed.data.company_name.trim(),
      timezone: parsed.data.timezone,
      fullName: parsed.data.admin_full_name.trim(),
      email: parsed.data.admin_email,
      password: parsed.data.password,
      phone: parsed.data.admin_phone?.trim() || null,
      province: parsed.data.province?.trim() || null,
      captchaToken: formData.get("captcha_token")?.toString() ?? null,
    });
    if (!result.ok) return signupFailure(_prev, formData, result.error);
    return result;
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message.trim()
        : SIGNUP_GENERIC_ERROR;
    return signupFailure(_prev, formData, message);
  }
}

export async function resendSelfSignupAction(
  _prev: { error?: string; warning?: string },
  formData: FormData
): Promise<{ error?: string; warning?: string }> {
  const result = await resendSelfSignup(
    formData.get("email")?.toString() ?? "",
    formData.get("captcha_token")?.toString() ?? null
  );
  if (!result.ok) return { error: result.error };
  return { warning: result.warning };
}

export async function changeSelfSignupEmailAction(email: string): Promise<void> {
  await abandonSelfSignup(email);
}

export async function completeOnboardingAction(): Promise<{ error?: string }> {
  const profile = await requireRole("admin", { skipMfaCheck: true });
  const supabase = await createClient();

  const { error } = await supabase
    .from("companies")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", profile.company_id);

  if (error) return { error: error.message };

  revalidatePath(ONBOARDING_PATH);
  revalidatePath("/dashboard");
  await recordProductEvent({
    name: "onboarding_step",
    companyId: profile.company_id,
    context: { step: "done" },
  });
  redirect("/dashboard");
}

export async function dismissOnboardingAction(): Promise<{ error?: string }> {
  const profile = await requireRole("admin", { skipMfaCheck: true });
  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({ onboarding_dismissed_at: new Date().toISOString() })
    .eq("id", profile.company_id);

  if (error) {
    return {
      error:
        "Couldn't snooze setup. Apply the onboarding migration, then try again.",
    };
  }

  revalidatePath(ONBOARDING_PATH);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/** Create first vehicle from the wizard, then advance. */
export async function onboardingCreateVehicleAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const profile = await requireRole("admin", { skipMfaCheck: true });
  const parsed = vehicleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").insert({
    company_id: profile.company_id,
    name: parsed.data.name.trim(),
    plate: parsed.data.plate?.trim() || null,
    capacity: parseVehicleCapacity(parsed.data.capacity),
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/vehicles");
  revalidatePath(ONBOARDING_PATH);
  redirect(`${ONBOARDING_PATH}?step=customer`);
}

export async function onboardingEnableSelfAsDriverAction(): Promise<{
  error?: string;
}> {
  const profile = await requireRole("admin", { skipMfaCheck: true });
  // Own-row can_drive changes are rejected for the caller's JWT.
  const service = createServiceClient();

  const { error } = await service
    .from("profiles")
    .update({ can_drive: true })
    .eq("id", profile.id)
    .eq("company_id", profile.company_id)
    .eq("role", "admin");

  if (error) return { error: error.message };

  revalidatePath("/dashboard/drivers");
  revalidatePath(ONBOARDING_PATH);
  redirect(`${ONBOARDING_PATH}?step=customer`);
}

/** Persist once-vs-twice PackRoute cadence from onboarding. */
export async function onboardingSaveRouteCadenceAction(
  cadence: "once" | "twice"
): Promise<{ error?: string }> {
  const profile = await requireRole("admin", { skipMfaCheck: true });
  if (cadence !== "once" && cadence !== "twice") {
    return { error: "Choose once or twice per day." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({ route_cadence: cadence })
    .eq("id", profile.company_id);

  if (error) return { error: error.message };

  revalidatePath(ONBOARDING_PATH);
  revalidatePath("/dashboard/route");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  revalidatePath("/today");
  revalidatePath("/tomorrow");
  return {};
}

/** @deprecated Use onboardingEnableSelfAsDriverAction */
export const onboardingEnableSelfAsHikerAction =
  onboardingEnableSelfAsDriverAction;

const companyInfoSchema = z.object({
  default_hike_rate: z.string().min(1, "Default hike price is required."),
  night_before_reminder_time: z
    .string()
    .min(1, "Reminder time is required."),
});

function parseRateToCents(raw?: string): number | null {
  if (!raw?.trim()) return null;
  const n = Number.parseFloat(raw.replace(/[$,\s]/g, ""));
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** Save company defaults from the wizard, then advance to done. */
export async function onboardingSaveCompanyInfoAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const profile = await requireRole("admin", { skipMfaCheck: true });
  const parsed = companyInfoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const rateCents = parseRateToCents(parsed.data.default_hike_rate);
  if (rateCents == null) {
    return { error: "Enter a valid hike price (e.g. 60.00)" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({
      default_hike_rate_cents: rateCents,
      night_before_reminder_time: parsed.data.night_before_reminder_time,
    })
    .eq("id", profile.company_id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/billing");
  revalidatePath(ONBOARDING_PATH);
  await recordProductEvent({
    name: "onboarding_step",
    companyId: profile.company_id,
    context: { step: "prices" },
  });
  redirect(`${ONBOARDING_PATH}?step=try`);
}

const welcomeSchema = z.object({
  outing_style: z.enum(["walk", "hike"]),
  route_cadence: z.enum(["once", "twice"]),
  vehicle_name: z.string().optional(),
});

export async function onboardingSaveWelcomeAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const profile = await requireRole("admin", { skipMfaCheck: true });
  const parsed = welcomeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Choose walking or hiking, and how many outings you run." };
  }

  const supabase = await createClient();
  const vehicleName = parsed.data.vehicle_name?.trim() ?? "";
  if (vehicleName) {
    const vehicle = vehicleSchema.safeParse({ name: vehicleName });
    if (!vehicle.success) {
      return { error: vehicle.error.issues[0]?.message ?? "Invalid vehicle" };
    }
    const { error: vehicleError } = await supabase.from("vehicles").insert({
      company_id: profile.company_id,
      name: vehicle.data.name.trim(),
      plate: null,
      capacity: parseVehicleCapacity(undefined),
      is_active: true,
    });
    if (vehicleError) return { error: vehicleError.message };
  }

  const { error } = await supabase
    .from("companies")
    .update({
      route_cadence: parsed.data.route_cadence,
      outing_style: parsed.data.outing_style,
      onboarding_welcome_at: new Date().toISOString(),
    })
    .eq("id", profile.company_id);

  if (error) {
    const { error: cadenceError } = await supabase
      .from("companies")
      .update({ route_cadence: parsed.data.route_cadence })
      .eq("id", profile.company_id);
    if (cadenceError) return { error: cadenceError.message };
  }

  revalidatePath(ONBOARDING_PATH);
  revalidatePath("/dashboard/route");
  revalidatePath("/dashboard/settings");
  await recordProductEvent({
    name: "onboarding_step",
    companyId: profile.company_id,
    context: { step: "welcome" },
  });
  redirect(`${ONBOARDING_PATH}?step=customer`);
}

export async function onboardingCreateCustomerAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const profile = await requireRole("admin", { skipMfaCheck: true });
  const parsed = customerSchema.safeParse({
    ...Object.fromEntries(formData),
    email: formData.get("email")?.toString() ?? "",
    address_line2: formData.get("address_line2")?.toString() ?? "",
    night_before_reminders_enabled: true,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid customer" };
  }

  const address = formatCustomerAddress(parsed.data);
  const coords = await resolveCustomerCoordinates(address);
  if (!coords.ok) return { error: coords.error };

  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert({
    company_id: profile.company_id,
    owner_name: parsed.data.owner_name,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    address_line1: parsed.data.address_line1,
    address_line2: parsed.data.address_line2?.trim() || null,
    city: parsed.data.city,
    state_province: parsed.data.state_province,
    postal_code: parsed.data.postal_code,
    address,
    address_lat: coords.lat,
    address_lng: coords.lng,
    is_active: true,
    night_before_reminders_enabled: true,
  });
  if (error) return { error: error.message };

  await supabase
    .from("companies")
    .update({ sms_test_phone: parsed.data.phone })
    .eq("id", profile.company_id);
  if (digitsOnly(parsed.data.phone).length >= 10 && !profile.phone) {
    const service = createServiceClient();
    await service
      .from("profiles")
      .update({ phone: parsed.data.phone })
      .eq("id", profile.id);
  }

  revalidatePath("/dashboard/customers");
  revalidatePath(ONBOARDING_PATH);
  await recordProductEvent({
    name: "onboarding_step",
    companyId: profile.company_id,
    context: { step: "customer" },
  });
  redirect(`${ONBOARDING_PATH}?step=dog`);
}

export async function onboardingCreateDogAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const profile = await requireRole("admin", { skipMfaCheck: true });
  const name = formData.get("name")?.toString().trim() ?? "";
  if (!name) return { error: "Dog name is required." };

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("company_id", profile.company_id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!customer) return { error: "Add a customer first." };

  const { error } = await supabase.from("dogs").insert({
    company_id: profile.company_id,
    customer_id: customer.id,
    name,
    is_active: true,
    schedule_type: "recurring",
    pickup_window_start: "08:00",
    pickup_window_end: "08:30",
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/dogs");
  revalidatePath(ONBOARDING_PATH);
  await recordProductEvent({
    name: "onboarding_step",
    companyId: profile.company_id,
    context: { step: "dog" },
  });
  redirect(`${ONBOARDING_PATH}?step=route`);
}

export async function onboardingCreateRouteAction(
  prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const result = await createRouteAction(prev, formData);
  if (result?.error) return { error: result.error };
  revalidatePath(ONBOARDING_PATH);
  const routeProfile = await requireRole("admin", { skipMfaCheck: true });
  await recordProductEvent({
    name: "onboarding_step",
    companyId: routeProfile.company_id,
    context: { step: "route" },
  });
  redirect(`${ONBOARDING_PATH}?step=prices`);
}

export async function onboardingSendSampleTextAction(
  _prev: { error?: string; preview?: string },
  formData: FormData
): Promise<{ error?: string; preview?: string }> {
  const profile = await requireRole("admin", { skipMfaCheck: true });
  const phone = sampleTextRecipient(formData.get("phone")?.toString() ?? "");
  if (digitsOnly(phone).length < 10) {
    return { error: "Enter the mobile number that should receive the sample text." };
  }

  const supabase = await createClient();
  const { data: dog } = await supabase
    .from("dogs")
    .select("name, pickup_window_start, pickup_window_end")
    .eq("company_id", profile.company_id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const preview = sampleReminderPreview({
    ownerName: profile.full_name,
    dogName: dog?.name ?? null,
    windowStart: dog?.pickup_window_start ?? undefined,
    windowEnd: dog?.pickup_window_end ?? undefined,
  });

  const sent = await sendSms(phone, preview, { timeoutMs: 8000 });
  if (!sent.ok) {
    return {
      preview,
      error:
        sent.outcome === "failed" && sent.error === "Twilio is not configured"
          ? "Twilio is not configured yet. The preview above is the text customers would get."
          : "The text did not send. The preview above is what it would say.",
    };
  }

  await supabase
    .from("companies")
    .update({
      sms_test_phone: phone,
      onboarding_sample_text_at: new Date().toISOString(),
    })
    .eq("id", profile.company_id);

  revalidatePath(ONBOARDING_PATH);
  await recordProductEvent({
    name: "first_text_sent",
    companyId: profile.company_id,
    once: true,
  });
  return { preview };
}

export async function onboardingCreateSampleInvoiceAction(): Promise<{
  error?: string;
  invoiceId?: string;
}> {
  const profile = await requireRole("admin", { skipMfaCheck: true });
  const supabase = await createClient();
  const [{ data: company }, { data: customer }, { data: dog }] = await Promise.all([
    supabase
      .from("companies")
      .select("timezone, default_hike_rate_cents")
      .eq("id", profile.company_id)
      .maybeSingle(),
    supabase
      .from("customers")
      .select("id, owner_name")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("dogs")
      .select("id, name")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!customer) return { error: "Add a customer before creating a draft invoice." };
  const rate = company?.default_hike_rate_cents;
  if (rate == null) return { error: "Set a CA$ price first." };

  const today = getDateInTimezone(company?.timezone ?? "America/Vancouver", 0);
  const invoiceNumber = await nextInvoiceNumber(profile.company_id);
  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      company_id: profile.company_id,
      customer_id: customer.id,
      status: "draft",
      period_start: today,
      period_end: today,
      currency: "CAD",
      subtotal_cents: rate,
      total_cents: rate,
      invoice_number: invoiceNumber,
      notes: "Sample draft from setup.",
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error || !invoice) return { error: error?.message ?? "Could not create the draft." };

  const { error: lineError } = await supabase.from("invoice_lines").insert({
    invoice_id: invoice.id,
    hike_date: today,
    dog_id: dog?.id ?? null,
    description: dog?.name ? `Sample outing — ${dog.name}` : "Sample outing",
    quantity: 1,
    unit_amount_cents: rate,
    line_total_cents: rate,
  });
  if (lineError) return { error: lineError.message };

  revalidatePath("/dashboard/invoices");
  revalidatePath(ONBOARDING_PATH);
  await recordProductEvent({
    name: "first_invoice",
    companyId: profile.company_id,
    once: true,
  });
  return { invoiceId: invoice.id as string };
}

export async function onboardingUploadSamplePhotoAction(
  _prev: { error?: string; galleryUrl?: string },
  formData: FormData
): Promise<{ error?: string; galleryUrl?: string }> {
  const profile = await requireRole("admin", { skipMfaCheck: true });
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo to upload." };
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return { error: "That photo is larger than 5 MB." };
  }
  if (file.type && file.type !== "image/jpeg" && file.type !== "image/jpg") {
    return { error: "Upload a JPEG photo." };
  }

  const supabase = await createClient();
  const [{ data: route }, { data: dog }] = await Promise.all([
    supabase
      .from("routes")
      .select("id")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("dogs")
      .select("id, customer_id")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!route || !dog) {
    return { error: "Add a dog and a route before uploading a sample photo." };
  }

  const { data: company } = await supabase
    .from("companies")
    .select("timezone")
    .eq("id", profile.company_id)
    .maybeSingle();
  const today = getDateInTimezone(company?.timezone ?? "America/Vancouver", 0);

  let hikeId: string | null = null;
  const { data: existingHike } = await supabase
    .from("hikes")
    .select("id")
    .eq("company_id", profile.company_id)
    .eq("route_id", route.id)
    .eq("date", today)
    .maybeSingle();
  hikeId = existingHike?.id ?? null;
  if (!hikeId) {
    const { data: created, error: hikeError } = await supabase
      .from("hikes")
      .insert({
        company_id: profile.company_id,
        route_id: route.id,
        date: today,
        status: "planned",
        period: "morning",
      })
      .select("id")
      .single();
    if (hikeError || !created) {
      return { error: hikeError?.message ?? "Could not start a sample hike." };
    }
    hikeId = created.id as string;
  }

  const photoId = randomUUID();
  if (!isUuid(photoId) || !isUuid(hikeId)) {
    return { error: "Could not prepare the photo." };
  }
  const storagePath = buildPhotoStoragePath(profile.company_id, hikeId, photoId);
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(HIKE_PHOTOS_BUCKET)
    .upload(storagePath, bytes, { contentType: "image/jpeg", upsert: false });
  if (uploadError) return { error: "Could not store the photo." };

  const { error: photoError } = await supabase.from("hike_photos").insert({
    id: photoId,
    company_id: profile.company_id,
    hike_id: hikeId,
    uploaded_by: profile.id,
    storage_path: storagePath,
    caption: "Sample from setup",
  });
  if (photoError) return { error: "Could not save the photo." };

  const { error: tagError } = await supabase.from("hike_photo_dogs").insert({
    photo_id: photoId,
    dog_id: dog.id,
  });
  if (tagError) return { error: "Could not tag the dog on the photo." };

  const token = generateShareToken();
  const service = createServiceClient();
  const { error: shareError } = await service.from("hike_photo_shares").upsert(
    {
      company_id: profile.company_id,
      hike_id: hikeId,
      customer_id: dog.customer_id,
      token,
    },
    { onConflict: "hike_id,customer_id", ignoreDuplicates: true }
  );
  if (shareError) return { error: "Photo saved, but the gallery link failed." };

  const { data: share } = await service
    .from("hike_photo_shares")
    .select("token")
    .eq("hike_id", hikeId)
    .eq("customer_id", dog.customer_id)
    .maybeSingle();

  revalidatePath("/dashboard/photos");
  revalidatePath(ONBOARDING_PATH);
  await recordProductEvent({
    name: "first_photo",
    companyId: profile.company_id,
    once: true,
  });
  return { galleryUrl: buildGalleryUrl((share?.token as string) ?? token) };
}
