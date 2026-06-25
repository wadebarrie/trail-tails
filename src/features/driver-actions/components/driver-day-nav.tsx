import Link from "next/link";

const tabs = [
  { href: "/today", label: "Today" },
  { href: "/tomorrow", label: "Tomorrow" },
] as const;

export function DriverDayNav({ active }: { active: "today" | "tomorrow" }) {
  return (
    <nav
      aria-label="Schedule day"
      className="mb-6 flex gap-2 rounded-xl bg-white/5 p-1"
    >
      {tabs.map((tab) => {
        const isActive =
          (active === "today" && tab.href === "/today") ||
          (active === "tomorrow" && tab.href === "/tomorrow");

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 rounded-lg py-2.5 text-center text-sm font-medium transition ${
              isActive
                ? "bg-white text-[var(--color-trail-800)] shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
