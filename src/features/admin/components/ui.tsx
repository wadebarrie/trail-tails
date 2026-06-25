import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/hikes/today", label: "Today" },
  { href: "/dashboard/hikes/tomorrow", label: "Tomorrow" },
  { href: "/dashboard/route", label: "Route" },
  { href: "/dashboard/customers", label: "Customers" },
  { href: "/dashboard/dogs", label: "Dogs" },
  { href: "/dashboard/pending-requests", label: "Requests" },
  { href: "/dashboard/drivers", label: "Drivers" },
  { href: "/dashboard/exceptions", label: "Exceptions" },
  { href: "/dashboard/sms", label: "SMS" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/logs", label: "Logs" },
];

export function AdminNav() {
  return (
    <nav
      className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 text-sm text-stone-600 sm:mx-0 sm:flex-wrap sm:gap-x-4 sm:gap-y-2 sm:px-0 sm:pb-0"
      aria-label="Admin navigation"
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="shrink-0 rounded-lg px-3 py-2 hover:bg-stone-100 hover:text-[var(--color-trail-700)] sm:px-0 sm:py-0 sm:hover:bg-transparent sm:hover:underline"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function TableShell({
  children,
  minWidth = "36rem",
}: {
  children: React.ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div
        className="overflow-hidden rounded-xl border border-stone-200 bg-white"
        style={{ minWidth }}
      >
        {children}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">{title}</h1>
        {description ? (
          <p className="mt-1 text-stone-600">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-stone-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const tones = {
    neutral: "bg-stone-100 text-stone-700",
    green: "bg-green-100 text-green-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center text-stone-500">
      {message}
    </p>
  );
}

export function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center rounded-lg bg-[var(--color-trail-700)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-trail-600)]"
    >
      {children}
    </Link>
  );
}
