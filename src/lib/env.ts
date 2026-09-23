import { z } from "zod";

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().url().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const productionOptionalWarnings = [
  "NEXT_PUBLIC_APP_URL",
  "CRON_SECRET",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "TWILIO_WEBHOOK_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "GOOGLE_MAPS_API_KEY",
] as const;

/** Supabase publishable key (new format) or legacy anon key */
export function getSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    ""
  );
}

export function getClientEnv() {
  const result = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: getSupabaseAnonKey(),
  });

  if (!result.success) {
    throw new Error(
      "Missing client env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in .env.local"
    );
  }

  return result.data;
}

let productionEnvWarned = false;

/** Warn once in production when optional integrations are unset (fail soft). */
function warnMissingProductionEnv() {
  if (productionEnvWarned) return;
  if (process.env.NODE_ENV !== "production") return;
  productionEnvWarned = true;

  const missing: string[] = productionOptionalWarnings.filter(
    (key) => !process.env[key]?.trim()
  );

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    missing.unshift("SUPABASE_SERVICE_ROLE_KEY");
  }

  if (missing.length === 0) return;

  console.warn(
    `[env] Production is missing optional/server vars (features may fail): ${missing.join(", ")}`
  );
}

export function getServerEnv() {
  getClientEnv();
  warnMissingProductionEnv();
  return serverSchema.parse(process.env);
}
