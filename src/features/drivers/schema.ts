import { z } from "zod";
import { digitsOnly } from "@/lib/phone";

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
        message: "Enter a valid phone number (at least 10 digits)",
      });
    }
  });

export const driverCreateSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
  phone: optionalPhone,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const driverUpdateSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required"),
  phone: optionalPhone,
  is_active: z.coerce.boolean().optional(),
  can_drive: z.coerce.boolean().optional(),
});

export type DriverCreateFormData = z.infer<typeof driverCreateSchema>;
export type DriverUpdateFormData = z.infer<typeof driverUpdateSchema>;
