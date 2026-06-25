"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AUTH_ROUTES } from "@/features/auth/constants";

type SignOutButtonProps = {
  className?: string;
  label?: string;
};

export function SignOutButton({
  className = "",
  label = "Sign out",
}: SignOutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace(AUTH_ROUTES.login);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className={
        className ||
        "text-sm text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline disabled:opacity-60"
      }
    >
      {pending ? "Signing out…" : label}
    </button>
  );
}
