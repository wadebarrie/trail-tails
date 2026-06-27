"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  isGroupActive,
  isMobileMoreActive,
  isMobilePeopleActive,
  isNavActive,
  mobileMoreSections,
  mobilePeopleNav,
  mobilePrimaryNav,
  navGroups,
  primaryNav,
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

function desktopLinkClass(active: boolean) {
  return active
    ? "rounded-lg bg-[var(--color-trail-700)] px-3 py-2 font-medium text-white shadow-sm"
    : "rounded-lg px-3 py-2 text-stone-600 hover:bg-stone-100 hover:text-[var(--color-trail-800)]";
}

function mobileTabClass(active: boolean) {
  return active
    ? "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[var(--color-trail-700)]"
    : "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-stone-500";
}

function sheetLinkClass(active: boolean) {
  return active
    ? "rounded-lg bg-[var(--color-trail-50)] px-3 py-3 font-medium text-[var(--color-trail-800)] ring-1 ring-[var(--color-trail-600)]"
    : "rounded-lg px-3 py-3 text-stone-700 hover:bg-stone-50";
}

function NavDropdown({
  group,
  pathname,
  pendingRequestCount,
}: {
  group: NavGroup;
  pathname: string;
  pendingRequestCount: number;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const active = isGroupActive(pathname, group);
  const showBadge =
    group.id === "operations" && pendingRequestCount > 0;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1.5 ${
          active
            ? "rounded-lg bg-[var(--color-trail-700)] px-3 py-2 font-medium text-white shadow-sm"
            : "rounded-lg px-3 py-2 text-stone-600 hover:bg-stone-100 hover:text-[var(--color-trail-800)]"
        }`}
      >
        <span>{group.label}</span>
        {showBadge ? <RequestBadge count={pendingRequestCount} /> : null}
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 min-w-[12rem] rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
        >
          {group.items.map((item) => {
            const itemActive = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                aria-current={itemActive ? "page" : undefined}
                className={`flex items-center justify-between gap-2 px-3 py-2.5 text-sm ${
                  itemActive
                    ? "bg-[var(--color-trail-50)] font-medium text-[var(--color-trail-800)]"
                    : "text-stone-700 hover:bg-stone-50"
                }`}
                onClick={() => setOpen(false)}
              >
                <span>{item.label}</span>
                {item.showRequestBadge && pendingRequestCount > 0 ? (
                  <RequestBadge count={pendingRequestCount} />
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
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
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
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
        className="absolute inset-x-0 bottom-0 max-h-[75dvh] overflow-y-auto rounded-t-2xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl"
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

export function AdminNav({ pendingRequestCount }: AdminNavProps) {
  const pathname = usePathname();
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const peopleActive = isMobilePeopleActive(pathname);
  const moreActive = isMobileMoreActive(pathname);

  useEffect(() => {
    setPeopleOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop */}
      <nav
        className="hidden items-center gap-1 md:flex"
        aria-label="Admin navigation"
      >
        {primaryNav.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={desktopLinkClass(active)}
            >
              <NavLabel
                item={item}
                active={active}
                pendingRequestCount={pendingRequestCount}
              />
            </Link>
          );
        })}
        {navGroups.map((group) => (
          <NavDropdown
            key={group.id}
            group={group}
            pathname={pathname}
            pendingRequestCount={pendingRequestCount}
          />
        ))}
      </nav>

      {/* Mobile bottom bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
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
            onClick={() => setPeopleOpen(true)}
            aria-expanded={peopleOpen}
            aria-haspopup="dialog"
            className={mobileTabClass(peopleActive)}
          >
            <span
              className={`text-[11px] font-medium leading-tight ${
                peopleActive ? "text-[var(--color-trail-700)]" : "text-stone-500"
              }`}
            >
              People
            </span>
            {peopleActive ? (
              <span className="h-1 w-8 rounded-full bg-[var(--color-trail-600)]" />
            ) : (
              <span className="h-1 w-8" aria-hidden />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
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
        title="People"
        open={peopleOpen}
        onClose={() => setPeopleOpen(false)}
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {mobilePeopleNav.items.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={sheetLinkClass(active)}
                onClick={() => setPeopleOpen(false)}
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
      </MobileSheet>

      <MobileSheet
        title="More"
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
      >
        <MobileNavSections
          sections={mobileMoreSections}
          pathname={pathname}
          pendingRequestCount={pendingRequestCount}
          onNavigate={() => setMoreOpen(false)}
        />
      </MobileSheet>
    </>
  );
}
