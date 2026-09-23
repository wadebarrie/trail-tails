import { z } from "zod";

export const vehicleSchema = z.object({
  name: z.string().min(1, "Vehicle name is required"),
  plate: z.string().optional(),
  capacity: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;

export function parseVehicleCapacity(raw?: string): number | null {
  if (!raw?.trim()) return null;
  const n = Number.parseInt(raw.trim(), 10);
  if (Number.isNaN(n) || n < 1) return null;
  return n;
}

export function vehicleDisplayLabel(vehicle: {
  name: string;
  plate?: string | null;
}): string {
  const plate = vehicle.plate?.trim();
  return plate ? `${vehicle.name} · ${plate}` : vehicle.name;
}
