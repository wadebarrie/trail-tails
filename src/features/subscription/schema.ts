import { z } from "zod";
import {
  BILLING_CURRENCIES,
  BILLING_INTERVALS,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
} from "@/features/subscription/constants";

export const subscriptionUpdateSchema = z.object({
  company_id: z.string().uuid(),
  plan: z.enum(SUBSCRIPTION_PLANS),
  status: z.enum(SUBSCRIPTION_STATUSES),
  monthly_price: z.coerce.number().int().min(0),
  billing_currency: z.enum(BILLING_CURRENCIES),
  billing_interval: z.enum(BILLING_INTERVALS),
  grandfathered: z
    .union([z.literal("true"), z.literal("false"), z.literal("on"), z.literal("")])
    .optional()
    .transform((value) => value === "true" || value === "on"),
  trial_ends_at: z.string().optional(),
  notes: z.string().optional(),
});

export type SubscriptionUpdateInput = z.infer<typeof subscriptionUpdateSchema>;
