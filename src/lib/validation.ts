import { z } from "zod";

/** Accepts Supabase / seed UUID strings that Zod 4's strict RFC validator rejects. */
const UUID_LIKE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const uuidLike = z
  .string()
  .regex(UUID_LIKE, "Invalid ID format");

export const optionalUuidLike = z.preprocess(
  (value) => (typeof value === "string" && value.length > 0 ? value : null),
  uuidLike.nullable()
);
