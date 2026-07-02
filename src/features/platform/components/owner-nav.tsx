"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/owner", label: "Overview", exact: true },
  { href: "/owner/reviews", label: "Reviews" },
  { href: "/owner/events", label: "Events" },
  { href: "/owner/provision", label: "Provision" },
  { href: "/owner/settings", label: "Settings" },
] as const;

export function OwnerNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-[var(--glass-border-subtle)] pb-px">
      {NAV_ITEMS.map((item) => {
        const active =
          "exact" in item && item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-t-[var(--radius-surface)] px-3 py-2 text-sm font-medium motion-interactive ${
              active
                ? "surface-glass-strong border border-b-0 border-[var(--glass-border-subtle)] text-[var(--color-trail-800)]"
                : "text-stone-600 hover:bg-white/50 hover:text-stone-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
