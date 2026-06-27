import { z } from "zod";

export const driverCreateSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

export const driverUpdateSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
});

export type DriverCreateFormData = z.infer<typeof driverCreateSchema>;
export type DriverUpdateFormData = z.infer<typeof driverUpdateSchema>;
