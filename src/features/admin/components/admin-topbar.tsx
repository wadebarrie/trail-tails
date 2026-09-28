import Link from "next/link";
import { AdminGlobalSearch } from "@/features/admin/components/admin-global-search";
import { RoleSwitchLink } from "@/features/auth/components/role-switch-link";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { PackRouteLogo } from "@/features/brand/components/packroute-logo";
import type { Profile } from "@/types";

export function AdminTopbar({
  profile,
  companyName,
}: {
  profile: Profile;
  companyName: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="min-w-0 md:hidden">
            <PackRouteLogo href="/dashboard" className="shrink-0" />
            {companyName ? (
              <p className="truncate text-xs text-stone-500">{companyName}</p>
            ) : null}
          </div>

          <div className="hidden min-w-0 flex-1 md:block">
            <AdminGlobalSearch />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            {profile.is_platform_owner ? (
              <Link
                href="/owner"
                className="hidden text-sm text-stone-600 hover:text-[var(--color-trail-700)] hover:underline lg:inline"
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
            <span className="hidden max-w-[8rem] truncate text-sm text-stone-600 sm:inline">
              {profile.full_name}
            </span>
            <SignOutButton />
          </div>
        </div>

        <div className="md:hidden">
          <AdminGlobalSearch />
        </div>
      </div>
    </header>
  );
}
