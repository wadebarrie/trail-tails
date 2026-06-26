import { z } from "zod";
import { phonesMatch } from "@/lib/phone";

export const customerSchema = z
  .object({
    owner_name: z.string().min(1, "Owner name is required"),
    phone: z.string().min(10, "Valid phone number required"),
    secondary_owner_name: z.string().optional(),
    secondary_phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().min(1, "Address is required"),
    notes: z.string().optional(),
    is_active: z.coerce.boolean().optional(),
  })
  .superRefine((data, ctx) => {
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

    if (secondaryPhone && secondaryPhone.length < 10) {
      ctx.addIssue({
        code: "custom",
        message: "Valid second phone number required",
        path: ["secondary_phone"],
      });
    }

    if (
      secondaryPhone &&
      secondaryPhone.length >= 10 &&
      phonesMatch(secondaryPhone, data.phone)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Second phone must be different from the primary phone",
        path: ["secondary_phone"],
      });
    }
  });

export type CustomerFormData = z.infer<typeof customerSchema>;

export function secondaryContactPayload(data: CustomerFormData) {
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
