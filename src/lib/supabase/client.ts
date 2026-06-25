import { createBrowserClient } from "@supabase/ssr";
import { getClientEnv, getSupabaseAnonKey } from "@/lib/env";

export function createClient() {
  const { NEXT_PUBLIC_SUPABASE_URL } = getClientEnv();

  return createBrowserClient(
    NEXT_PUBLIC_SUPABASE_URL,
    getSupabaseAnonKey()
  );
}
