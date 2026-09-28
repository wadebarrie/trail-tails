"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  isNavActive,
  navGroups,
  primaryNav,
  type NavItem,
} from "@/features/admin/components/nav-config";
import { PackRouteLogo } from "@/features/brand/components/packroute-logo";

function RequestBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span className="ml-auto inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-bold leading-none text-stone-900">
      {label}
    </span>
  );
}

function SidebarLink({
  item,
  pendingRequestCount,
}: {
  item: NavItem;
  pendingRequestCount: number;
}) {
  const pathname = usePathname();
  const active = isNavActive(pathname, item.href);
  const showBadge = item.showRequestBadge && pendingRequestCount > 0;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold text-white"
          : "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white"
      }
    >
      <span className="truncate">{item.label}</span>
      {showBadge ? <RequestBadge count={pendingRequestCount} /> : null}
    </Link>
  );
}

export function AdminSidebar({
  companyName,
  pendingRequestCount,
}: {
  companyName: string | null;
  pendingRequestCount: number;
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-[var(--color-trail-900)] text-white md:flex">
      <div className="border-b border-white/10 px-4 py-4">
        <PackRouteLogo href="/dashboard" variant="light" />
        {companyName ? (
          <p className="mt-2 truncate text-xs text-white/60" title={companyName}>
            {companyName}
          </p>
        ) : null}
      </div>

      <div className="px-3 py-3">
        <Link
          href="/dashboard/hikes/today"
          className="flex items-center justify-center rounded-lg bg-[var(--color-cta)] px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-cta-hover)]"
        >
          Open today
        </Link>
      </div>

      <nav
        className="flex-1 space-y-5 overflow-y-auto px-3 pb-6"
        aria-label="Admin navigation"
      >
        <div className="space-y-0.5">
          {primaryNav.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              pendingRequestCount={pendingRequestCount}
            />
          ))}
        </div>

        {navGroups.map((group) => (
          <div key={group.id}>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarLink
                  key={item.href}
                  item={item}
                  pendingRequestCount={pendingRequestCount}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
