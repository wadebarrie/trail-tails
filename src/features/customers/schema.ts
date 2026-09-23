import { z } from "zod";
import { digitsOnly, phonesMatch } from "@/lib/phone";

const optionalEmail = z
  .string()
  .trim()
  .transform((v) => v.toLowerCase())
  .pipe(
    z.union([
      z.literal(""),
      z.string().email("Enter a valid email address"),
    ])
  );

const requiredPhone = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    if (digitsOnly(value).length < 10) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid phone number (at least 10 digits)",
      });
    }
  });

const optionalPhone = z
  .string()
  .trim()
  .optional()
  .transform((v) => v ?? "")
  .superRefine((value, ctx) => {
    if (!value) return;
    if (digitsOnly(value).length < 10) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid second phone number (at least 10 digits)",
      });
    }
  });

const customerCore = {
  owner_name: z.string().trim().min(1, "Owner name is required"),
  phone: requiredPhone,
  secondary_owner_name: z.string().optional(),
  secondary_phone: optionalPhone,
  email: optionalEmail,
  notes: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  night_before_reminders_enabled: z.coerce.boolean().optional(),
};

function refineSecondaryContact<
  T extends {
    phone: string;
    secondary_owner_name?: string;
    secondary_phone?: string;
  },
>(data: T, ctx: z.RefinementCtx) {
  const secondaryName = data.secondary_owner_name?.trim() ?? "";
  const secondaryPhone = data.secondary_phone?.trim() ?? "";

  if (secondaryName && !secondaryPhone) {
    ctx.addIssue({
      code: "custom",
      message: "Second contact phone is required when a name is provided",
      path: ["secondary_phone"],
    });
  }

  if (secondaryPhone && !secondaryName) {
    ctx.addIssue({
      code: "custom",
      message: "Second contact name is required when a phone is provided",
      path: ["secondary_owner_name"],
    });
  }

  if (
    secondaryPhone &&
    digitsOnly(secondaryPhone).length >= 10 &&
    phonesMatch(secondaryPhone, data.phone)
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Second phone must be different from the primary phone",
      path: ["secondary_phone"],
    });
  }
}

/** Admin create/edit form — structured address required. */
export const customerSchema = z
  .object({
    ...customerCore,
    address_line1: z.string().trim().min(1, "Address line 1 is required"),
    address_line2: z.string().trim().optional(),
    city: z.string().trim().min(1, "City is required"),
    state_province: z.string().trim().min(1, "State / province is required"),
    postal_code: z
      .string()
      .trim()
      .min(3, "Postal / ZIP code is required")
      .max(12, "Postal / ZIP code is too long"),
  })
  .superRefine(refineSecondaryContact);

/**
 * CSV import — freeform `customer_address` maps to line1;
 * city / region / postal optional until filled in admin.
 */
export const customerImportSchema = z
  .object({
    ...customerCore,
    address_line1: z.string().trim().min(1, "Address is required"),
    address_line2: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state_province: z.string().trim().optional(),
    postal_code: z.string().trim().optional(),
  })
  .superRefine(refineSecondaryContact);

export type CustomerFormData = z.infer<typeof customerSchema>;
export type CustomerImportData = z.infer<typeof customerImportSchema>;

export function secondaryContactPayload(data: {
  secondary_owner_name?: string | null;
  secondary_phone?: string | null;
}) {
  const secondaryName = data.secondary_owner_name?.trim() ?? "";
  const secondaryPhone = data.secondary_phone?.trim() ?? "";

  if (secondaryName && secondaryPhone) {
    return {
      secondary_owner_name: secondaryName,
      secondary_phone: secondaryPhone,
    };
  }

  return {
    secondary_owner_name: null,
    secondary_phone: null,
  };
}
