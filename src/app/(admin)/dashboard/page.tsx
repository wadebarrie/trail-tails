import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Badge,
  Card,
  PageHeader,
  PrimaryLink,
} from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { getCompanyTimezone } from "@/features/company/queries";
import {
  getHikeDaySummaries,
  type HikeDaySummary,
} from "@/features/hikes/queries";
import { companyNeedsOnboarding } from "@/features/onboarding/queries";
import { ONBOARDING_PATH } from "@/features/onboarding/constants";
import { createClient } from "@/lib/supabase/server";
import { formatDateLabel, getDateInTimezone } from "@/lib/dates";
import { PerfTimer } from "@/lib/perf";

function daySummaryHint(counts: HikeDaySummary) {
  if (counts.routesScheduled === 0) {
    return "No routes scheduled this day";
  }
  if (counts.dogs === 0) {
    return `${counts.routesScheduled} route${counts.routesScheduled === 1 ? "" : "s"} · no dogs yet`;
  }
  const routePart =
    counts.routesWithDogs === counts.routesScheduled
      ? `${counts.routesWithDogs} route${counts.routesWithDogs === 1 ? "" : "s"}`
      : `${counts.routesWithDogs} of ${counts.routesScheduled} routes`;
  return `${routePart} · pickups scheduled`;
}

export default async function DashboardPage() {
  const timer = new PerfTimer("page dashboard");
  const profile = await requireRole("admin");
  timer.mark("auth");

  if (await companyNeedsOnboarding(profile.company_id)) {
    redirect(ONBOARDING_PATH);
  }

  const supabase = await createClient();
  const tz = await getCompanyTimezone(profile.company_id);
  timer.mark("timezone");

  const today = getDateInTimezone(tz, 0);
  const tomorrow = getDateInTimezone(tz, 1);

  const [
    daySummaries,
    { count: pendingCount },
    { count: customerCount },
    { count: dogCount },
    { count: routeCount },
  ] = await Promise.all([
    getHikeDaySummaries(profile.company_id, [today, tomorrow], {
      timeZone: tz,
    }),
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
      .eq("company_id", profile.company_id)
      .eq("is_active", true),
  ]);
  timer.end();

  const todayCounts = daySummaries.get(today) ?? {
    dogs: 0,
    routesScheduled: 0,
    routesWithDogs: 0,
  };
  const tomorrowCounts = daySummaries.get(tomorrow) ?? {
    dogs: 0,
    routesScheduled: 0,
    routesWithDogs: 0,
  };
  const pending = pendingCount ?? 0;

  /** Operations first — what needs attention today; roster second — business size. */
  const operationsCards = [
    {
      title: "Today",
      value:
        todayCounts.dogs === 1
          ? "1 dog"
          : `${todayCounts.dogs} dogs`,
      href: "/dashboard/hikes/today",
      hint: daySummaryHint(todayCounts),
    },
    {
      title: "Pending requests",
      value: String(pending),
      href: "/dashboard/pending-requests",
      hint:
        pending === 0
          ? "No customer texts waiting"
          : pending === 1
            ? "Approve or decline before it affects the route"
            : "Approve or decline before they affect routes",
      alert: pending > 0,
    },
    {
      title: "Tomorrow",
      value:
        tomorrowCounts.dogs === 1
          ? "1 dog"
          : `${tomorrowCounts.dogs} dogs`,
      href: "/dashboard/hikes/tomorrow",
      hint: daySummaryHint(tomorrowCounts),
    },
  ];

  const rosterCards = [
    {
      title: "Active dogs",
      value: String(dogCount ?? 0),
      href: "/dashboard/dogs",
      hint: "On your roster",
    },
    {
      title: "Active customers",
      value: String(customerCount ?? 0),
      href: "/dashboard/customers",
      hint: "Households you serve",
    },
    {
      title: "Route templates",
      value: String(routeCount ?? 0),
      href: "/dashboard/route",
      hint: "Weekly pickup order & drivers",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`${formatDateLabel(today, tz)} — operational snapshot for your routes and schedule.`}
      />

      <section aria-labelledby="dashboard-operations-heading">
        <h2
          id="dashboard-operations-heading"
          className="mb-3 text-sm font-medium uppercase tracking-wide text-stone-500"
        >
          Today &amp; schedule
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {operationsCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-stone-500">
                    {card.title}
                  </p>
                  {card.alert ? (
                    <Badge tone="amber">Action needed</Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-2xl font-semibold text-stone-900">
                  {card.value}
                </p>
                <p className="mt-1 text-sm text-stone-500">{card.hint}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="dashboard-roster-heading" className="mt-10">
        <h2
          id="dashboard-roster-heading"
          className="mb-3 text-sm font-medium uppercase tracking-wide text-stone-500"
        >
          Your roster
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rosterCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card>
                <p className="text-sm font-medium text-stone-500">
                  {card.title}
                </p>
                <p className="mt-2 text-2xl font-semibold text-stone-900">
                  {card.value}
                </p>
                <p className="mt-1 text-sm text-stone-500">{card.hint}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <PrimaryLink href="/dashboard/hikes/today">Open today&apos;s hikes</PrimaryLink>
        {pending > 0 ? (
          <Link
            href="/dashboard/pending-requests"
            className="inline-flex min-h-11 items-center rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 motion-interactive hover:border-amber-400"
          >
            Review pending requests
          </Link>
        ) : null}
        <Link
          href="/dashboard/customers/new"
          className="inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 motion-interactive hover:border-[var(--color-trail-600)] hover:text-[var(--color-trail-700)]"
        >
          Add customer
        </Link>
        <Link
          href="/dashboard/dogs/new"
          className="inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 motion-interactive hover:border-[var(--color-trail-600)] hover:text-[var(--color-trail-700)]"
        >
          Add dog
        </Link>
        <Link
          href="/dashboard/help"
          className="inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 motion-interactive hover:border-[var(--color-trail-600)] hover:text-[var(--color-trail-700)]"
        >
          Help &amp; guide
        </Link>
      </div>
    </div>
  );
}
