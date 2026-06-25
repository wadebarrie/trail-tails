"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavLink = {
  href: string;
  label: string;
  shortLabel?: string;
};

const allLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Home" },
  { href: "/dashboard/hikes/today", label: "Today" },
  { href: "/dashboard/hikes/tomorrow", label: "Tomorrow" },
  { href: "/dashboard/route", label: "Route" },
  { href: "/dashboard/customers", label: "Customers" },
  { href: "/dashboard/dogs", label: "Dogs" },
  { href: "/dashboard/pending-requests", label: "Requests" },
  { href: "/dashboard/drivers", label: "Drivers" },
  { href: "/dashboard/exceptions", label: "Exceptions" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/dashboard/sms", label: "SMS" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/logs", label: "Logs" },
];

const mobilePrimaryHrefs = new Set([
  "/dashboard",
  "/dashboard/hikes/today",
  "/dashboard/customers",
  "/dashboard/pending-requests",
]);

const mobilePrimaryLinks = allLinks.filter((link) => mobilePrimaryHrefs.has(link.href));
const mobileMoreLinks = allLinks.filter((link) => !mobilePrimaryHrefs.has(link.href));

function isLinkActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClassName(active: boolean, variant: "desktop" | "mobile" | "more") {
  if (variant === "desktop") {
    return active
      ? "rounded-lg bg-[var(--color-trail-700)] px-3 py-2 font-medium text-white shadow-sm"
      : "rounded-lg px-3 py-2 text-stone-600 hover:bg-stone-100 hover:text-[var(--color-trail-800)]";
  }
  if (variant === "mobile") {
    return active
      ? "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[var(--color-trail-700)]"
      : "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-stone-500";
  }
  return active
    ? "rounded-lg bg-[var(--color-trail-50)] px-3 py-3 font-medium text-[var(--color-trail-800)] ring-1 ring-[var(--color-trail-600)]"
    : "rounded-lg px-3 py-3 text-stone-700 hover:bg-stone-50";
}

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
  link,
  active,
  pendingRequestCount,
  compact,
}: {
  link: NavLink;
  active: boolean;
  pendingRequestCount: number;
  compact?: boolean;
}) {
  const showBadge = link.href === "/dashboard/pending-requests" && pendingRequestCount > 0;
  const label = compact ? (link.shortLabel ?? link.label) : link.label;

  return (
    <span className="relative inline-flex items-center gap-1.5">
      <span className={active ? "font-semibold" : undefined}>{label}</span>
      {showBadge ? <RequestBadge count={pendingRequestCount} /> : null}
    </span>
  );
}

type AdminNavProps = {
  pendingRequestCount: number;
};

export function AdminNav({ pendingRequestCount }: AdminNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreIsActive = mobileMoreLinks.some((link) => isLinkActive(pathname, link.href));

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMoreOpen(false);
    }
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  return (
    <>
      {/* Desktop / tablet */}
      <nav
        className="hidden flex-wrap gap-1 md:flex"
        aria-label="Admin navigation"
      >
        {allLinks.map((link) => {
          const active = isLinkActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={navLinkClassName(active, "desktop")}
            >
              <NavLabel
                link={link}
                active={active}
                pendingRequestCount={pendingRequestCount}
              />
            </Link>
          );
        })}
      </nav>

      {/* Mobile bottom bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Admin mobile navigation"
      >
        <div className="flex items-stretch">
          {mobilePrimaryLinks.map((link) => {
            const active = isLinkActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={navLinkClassName(active, "mobile")}
              >
                <span
                  className={`text-[11px] font-medium leading-tight ${
                    active ? "text-[var(--color-trail-700)]" : "text-stone-500"
                  }`}
                >
                  <NavLabel
                    link={link}
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
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            className={navLinkClassName(moreIsActive, "mobile")}
          >
            <span
              className={`text-[11px] font-medium leading-tight ${
                moreIsActive ? "text-[var(--color-trail-700)]" : "text-stone-500"
              }`}
            >
              More
            </span>
            {moreIsActive ? (
              <span className="h-1 w-8 rounded-full bg-[var(--color-trail-600)]" />
            ) : (
              <span className="h-1 w-8" aria-hidden />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile "More" sheet */}
      {moreOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-more-nav-title"
            className="absolute inset-x-0 bottom-0 max-h-[70dvh] overflow-y-auto rounded-t-2xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-200" />
            <h2
              id="admin-more-nav-title"
              className="mb-3 text-sm font-semibold text-stone-900"
            >
              More
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {mobileMoreLinks.map((link) => {
                const active = isLinkActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={navLinkClassName(active, "more")}
                    onClick={() => setMoreOpen(false)}
                  >
                    <NavLabel
                      link={link}
                      active={active}
                      pendingRequestCount={pendingRequestCount}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
