"use server";

import { createClient } from "@/lib/supabase/server";

/** @deprecated Use client SignOutButton — kept for any form actions still referencing it */
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
