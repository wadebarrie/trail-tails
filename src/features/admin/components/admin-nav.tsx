"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import {
  isMobileMoreActive,
  isNavActive,
  mobileMoreSections,
  mobilePrimaryNav,
  type NavGroup,
  type NavItem,
} from "@/features/admin/components/nav-config";

function RequestBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span
      className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white"
      aria-label={`${count} pending requests`}
    >
      {label}
    </span>
  );
}

function NavLabel({
  item,
  active,
  pendingRequestCount,
  compact,
}: {
  item: NavItem;
  active: boolean;
  pendingRequestCount: number;
  compact?: boolean;
}) {
  const showBadge = item.showRequestBadge && pendingRequestCount > 0;
  const label = compact ? (item.shortLabel ?? item.label) : item.label;

  return (
    <span className="relative inline-flex items-center gap-1.5">
      <span className={active ? "font-semibold" : undefined}>{label}</span>
      {showBadge ? <RequestBadge count={pendingRequestCount} /> : null}
    </span>
  );
}

function mobileTabClass(active: boolean) {
  return active
    ? "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[var(--color-trail-700)]"
    : "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-stone-500";
}

function sheetLinkClass(active: boolean) {
  return active
    ? "rounded-[var(--radius-surface)] bg-[var(--color-trail-50)] px-3 py-3 font-medium text-[var(--color-trail-800)] ring-1 ring-[var(--color-trail-600)]"
    : "rounded-[var(--radius-surface)] px-3 py-3 text-stone-700 motion-interactive hover:bg-white/60";
}

function MobileSheet({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="motion-sheet absolute inset-x-0 bottom-0 max-h-[75dvh] overflow-y-auto rounded-t-[var(--radius-card)] surface-glass-strong px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[var(--elevation-3)]"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-200" />
        <h2 id={titleId} className="mb-4 text-sm font-semibold text-stone-900">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

function MobileNavSections({
  sections,
  pathname,
  pendingRequestCount,
  onNavigate,
}: {
  sections: NavGroup[];
  pathname: string;
  pendingRequestCount: number;
  onNavigate: () => void;
}) {
  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <section key={section.id}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
            {section.label}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {section.items.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={sheetLinkClass(active)}
                  onClick={onNavigate}
                >
                  <NavLabel
                    item={item}
                    active={active}
                    pendingRequestCount={pendingRequestCount}
                  />
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

type AdminNavProps = {
  pendingRequestCount: number;
};

/** Mobile bottom navigation. Desktop uses AdminSidebar. */
export function AdminNav({ pendingRequestCount }: AdminNavProps) {
  const pathname = usePathname();
  const [moreOpenFor, setMoreOpenFor] = useState<string | null>(null);
  const moreOpen = moreOpenFor === pathname;
  const moreActive = isMobileMoreActive(pathname);

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 surface-glass border-t border-[var(--glass-border-subtle)] pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Admin mobile navigation"
      >
        <div className="flex items-stretch">
          {mobilePrimaryNav.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={mobileTabClass(active)}
              >
                <span
                  className={`text-[11px] font-medium leading-tight ${
                    active ? "text-[var(--color-trail-700)]" : "text-stone-500"
                  }`}
                >
                  <NavLabel
                    item={item}
                    active={active}
                    pendingRequestCount={pendingRequestCount}
                    compact
                  />
                </span>
                {active ? (
                  <span className="h-1 w-8 rounded-full bg-[var(--color-trail-600)]" />
                ) : (
                  <span className="h-1 w-8" aria-hidden />
                )}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpenFor(pathname)}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            className={mobileTabClass(moreActive)}
          >
            <span
              className={`text-[11px] font-medium leading-tight ${
                moreActive ? "text-[var(--color-trail-700)]" : "text-stone-500"
              }`}
            >
              More
            </span>
            {moreActive ? (
              <span className="h-1 w-8 rounded-full bg-[var(--color-trail-600)]" />
            ) : (
              <span className="h-1 w-8" aria-hidden />
            )}
          </button>
        </div>
      </nav>

      <MobileSheet
        title="More"
        open={moreOpen}
        onClose={() => setMoreOpenFor(null)}
      >
        <MobileNavSections
          sections={mobileMoreSections}
          pathname={pathname}
          pendingRequestCount={pendingRequestCount}
          onNavigate={() => setMoreOpenFor(null)}
        />
      </MobileSheet>
    </>
  );
}
