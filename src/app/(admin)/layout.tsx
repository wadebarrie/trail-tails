import type { Metadata } from "next";
import Link from "next/link";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { RoleSwitchLink } from "@/features/auth/components/role-switch-link";
import { AdminMfaGate } from "@/features/auth/components/admin-mfa-gate";
import { AdminNav } from "@/features/admin/components/admin-nav";
import { getCompanyName } from "@/features/company/queries";
import { requireRole } from "@/features/auth/queries";
import { getAdminMfaStatus } from "@/features/auth/mfa";
import { createClient } from "@/lib/supabase/server";
import { PerfTimer } from "@/lib/perf";
import { PackRouteLogo } from "@/features/brand/components/packroute-logo";
import { NOINDEX_ROBOTS } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const timer = new PerfTimer("page admin-layout");
  const profile = await requireRole("admin", { skipMfaCheck: true });
  timer.mark("auth");

  const supabase = await createClient();
  const [mfaStatus, companyName, { count: pendingRequestCount }] =
    await Promise.all([
      getAdminMfaStatus(),
      getCompanyName(profile.company_id),
      supabase
        .from("pending_requests")
        .select("*", { count: "exact", head: true })
        .eq("company_id", profile.company_id)
        .eq("status", "pending"),
    ]);
  timer.end();

  return (
    <div className="min-h-dvh bg-atmosphere">
      <header className="surface-header sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <PackRouteLogo href="/dashboard" className="shrink-0" />
                {companyName ? (
                  <>
                    <span
                      className="hidden h-4 w-px shrink-0 bg-stone-200 sm:block"
                      aria-hidden
                    />
                    <span
                      className="truncate text-sm font-medium text-stone-600"
                      title={companyName}
                    >
                      {companyName}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
              {profile.is_platform_owner ? (
                <Link
                  href="/owner"
                  className="hidden text-sm text-stone-600 hover:text-[var(--color-trail-700)] hover:underline sm:inline"
                >
                  Owner
                </Link>
              ) : null}
              <Link
                href="/dashboard/help"
                className="hidden text-sm text-stone-600 hover:text-[var(--color-trail-700)] hover:underline sm:inline"
              >
                Help
              </Link>
              <RoleSwitchLink profile={profile} variant="admin" />
              <span className="max-w-[7rem] truncate text-sm text-stone-600 sm:max-w-none">
                {profile.full_name}
              </span>
              <SignOutButton />
            </div>
          </div>
          <div className="md:mt-3">
            <AdminNav pendingRequestCount={pendingRequestCount ?? 0} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 pb-[max(5.5rem,env(safe-area-inset-bottom))] md:pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-8">
        <AdminMfaGate status={mfaStatus}>{children}</AdminMfaGate>
      </main>
    </div>
  );
}
