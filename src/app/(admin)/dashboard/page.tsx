import Link from "next/link";
import {
  Badge,
  Card,
  PageHeader,
  PrimaryLink,
} from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { getCompanyTimezone } from "@/features/company/queries";
import { getHikesWithStopsForDate } from "@/features/hikes/queries";
import { createClient } from "@/lib/supabase/server";
import { getDateInTimezone } from "@/lib/dates";
import { PerfTimer } from "@/lib/perf";

export default async function DashboardPage() {
  const timer = new PerfTimer("page dashboard");
  const profile = await requireRole("admin");
  timer.mark("auth");
  const supabase = await createClient();
  const tz = await getCompanyTimezone(profile.company_id);
  timer.mark("timezone");

  const today = getDateInTimezone(tz, 0);
  const tomorrow = getDateInTimezone(tz, 1);

  const [todayEntries, tomorrowEntries] = await Promise.all([
    getHikesWithStopsForDate(profile.company_id, today, { timeZone: tz }),
    getHikesWithStopsForDate(profile.company_id, tomorrow, { timeZone: tz }),
  ]);
  timer.mark("hikes");

  const [
    { count: pendingCount },
    { count: customerCount },
    { count: dogCount },
    { count: routeCount },
  ] = await Promise.all([
    supabase
      .from("pending_requests")
      .select("*", { count: "exact", head: true })
      .eq("company_id", profile.company_id)
      .eq("status", "pending"),
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("company_id", profile.company_id)
      .eq("is_active", true),
    supabase
      .from("dogs")
      .select("*", { count: "exact", head: true })
      .eq("company_id", profile.company_id)
      .eq("is_active", true),
    supabase
      .from("routes")
      .select("*", { count: "exact", head: true })
      .eq("company_id", profile.company_id),
  ]);
  timer.end();

  const todayStops = todayEntries.reduce(
    (n, e) => n + (e.hike?.stops?.length ?? 0),
    0
  );
  const tomorrowStops = tomorrowEntries.reduce(
    (n, e) => n + (e.hike?.stops?.length ?? 0),
    0
  );

  const cards = [
    {
      title: "Today",
      value: `${Math.floor(todayStops / 2)} dogs`,
      href: "/dashboard/hikes/today",
      hint: "Pickups & drop-offs",
    },
    {
      title: "Tomorrow",
      value: `${Math.floor(tomorrowStops / 2)} dogs`,
      href: "/dashboard/hikes/tomorrow",
      hint: "Preview schedule",
    },
    {
      title: "Pending requests",
      value: String(pendingCount ?? 0),
      href: "/dashboard/pending-requests",
      hint: "Customer SMS requests",
      alert: (pendingCount ?? 0) > 0,
    },
    {
      title: "Customers",
      value: String(customerCount ?? 0),
      href: "/dashboard/customers",
      hint: "Active customers",
    },
    {
      title: "Dogs",
      value: String(dogCount ?? 0),
      href: "/dashboard/dogs",
      hint: "Active dogs",
    },
    {
      title: "Routes",
      value: String(routeCount ?? 0),
      href: "/dashboard/route",
      hint: "Pickup order per route",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of today's operations"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card>
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-stone-500">{card.title}</p>
                {card.alert ? <Badge tone="amber">Action needed</Badge> : null}
              </div>
              <p className="mt-2 text-2xl font-semibold text-stone-900">
                {card.value}
              </p>
              <p className="mt-1 text-sm text-stone-500">{card.hint}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <PrimaryLink href="/dashboard/customers/new">Add customer</PrimaryLink>
        <PrimaryLink href="/dashboard/dogs/new">Add dog</PrimaryLink>
        <Link
          href="/dashboard/import"
          className="inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:border-[var(--color-trail-600)] hover:text-[var(--color-trail-700)]"
        >
          Bulk import
        </Link>
        <Link
          href="/dashboard/help"
          className="inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:border-[var(--color-trail-600)] hover:text-[var(--color-trail-700)]"
        >
          Help &amp; guide
        </Link>
      </div>
    </div>
  );
}
