import { createClient } from "@supabase/supabase-js";
import { getClientEnv, getServerEnv, getSupabaseAnonKey } from "@/lib/env";

/**
 * Service-role client for webhooks, cron jobs, and admin side-effects.
 * Bypasses RLS — never import in client components.
 */
export function createServiceClient() {
  const { NEXT_PUBLIC_SUPABASE_URL } = getClientEnv();
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for server-side operations"
    );
  }

  return createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/** Alias used by some Supabase SSR examples */
export { getSupabaseAnonKey };
