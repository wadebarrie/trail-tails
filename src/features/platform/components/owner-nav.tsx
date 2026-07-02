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
    <nav className="flex gap-1 overflow-x-auto border-b border-stone-200 pb-px">
      {NAV_ITEMS.map((item) => {
        const active =
          "exact" in item && item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "border border-b-0 border-stone-200 bg-white text-[var(--color-trail-800)]"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
