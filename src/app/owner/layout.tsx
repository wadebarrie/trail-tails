import type { Metadata } from "next";
import Link from "next/link";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { OwnerNav } from "@/features/platform/components/owner-nav";
import { requirePlatformOwner } from "@/features/platform/queries";
import { PackRouteLogo } from "@/features/brand/components/packroute-logo";
import { NOINDEX_ROBOTS } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export const dynamic = "force-dynamic";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformOwner();

  return (
    <div className="min-h-dvh bg-atmosphere">
      <header className="surface-header sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <PackRouteLogo
                href="/owner"
                suffix="Superadmin"
              />
              <span className="hidden text-sm text-stone-500 sm:inline">
                Platform analytics
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-sm text-stone-600 hover:text-[var(--color-trail-700)] hover:underline"
              >
                Admin dashboard
              </Link>
              <SignOutButton />
            </div>
          </div>
          <div className="mt-3">
            <OwnerNav />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
