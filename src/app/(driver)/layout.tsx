import type { Metadata } from "next";
import Link from "next/link";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { RoleSwitchLink } from "@/features/auth/components/role-switch-link";
import { requireDriverAccess } from "@/features/auth/queries";
import { RegisterServiceWorker } from "@/features/pwa/register-service-worker";
import { PackRouteMark } from "@/features/brand/components/packroute-mark";
import { NOINDEX_ROBOTS } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PackRoute",
  },
  formatDetection: {
    telephone: false,
  },
};

export const dynamic = "force-dynamic";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireDriverAccess();

  return (
    <div className="min-h-dvh bg-atmosphere-driver text-white">
      <RegisterServiceWorker />
      <header className="surface-header-dark sticky top-0 z-40 flex items-center justify-between px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex min-w-0 items-center gap-2.5">
          <PackRouteMark size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-widest text-white/60">
              PackRoute · Driver
            </p>
            <p className="mt-0.5 truncate text-sm text-white/80">
              {profile.full_name}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <Link
              href="/help"
              className="text-sm text-white/70 underline-offset-2 hover:text-white hover:underline"
            >
              Help
            </Link>
            <RoleSwitchLink profile={profile} variant="driver" />
          </div>
          <SignOutButton
            className="text-sm text-white/70 underline-offset-2 hover:text-white hover:underline"
          />
        </div>
      </header>
      <main className="px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );
}
