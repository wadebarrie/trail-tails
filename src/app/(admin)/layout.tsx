import Link from "next/link";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { RoleSwitchLink } from "@/features/auth/components/role-switch-link";
import { AdminNav } from "@/features/admin/components/admin-nav";
import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { count: pendingRequestCount } = await supabase
    .from("pending_requests")
    .select("*", { count: "exact", head: true })
    .eq("company_id", profile.company_id)
    .eq("status", "pending");

  return (
    <div className="min-h-dvh bg-stone-50">
      <header className="border-b border-stone-200 bg-white pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/dashboard"
              className="font-semibold text-[var(--color-trail-800)]"
            >
              Trail Tails
            </Link>
            <div className="flex items-center gap-3 sm:gap-4">
              <RoleSwitchLink profile={profile} variant="admin" />
              <span className="hidden text-sm text-stone-600 sm:inline">
                {profile.full_name}
              </span>
              <SignOutButton />
            </div>
          </div>
          <div className="mt-3">
            <AdminNav pendingRequestCount={pendingRequestCount ?? 0} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 pb-[max(5.5rem,env(safe-area-inset-bottom))] md:pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-8">
        {children}
      </main>
    </div>
  );
}
