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

  const operationsCards = [
    {
      title: "Today",
      value:
        todayCounts.dogs === 1 ? "1 dog" : `${todayCounts.dogs} dogs`,
      href: "/dashboard/hikes/today",
      hint: daySummaryHint(todayCounts),
      accent: "border-l-[var(--color-trail-600)] bg-[var(--color-trail-50)]/40",
      cta: "Open today’s list",
    },
    {
      title: "Customer texts",
      value: String(pending),
      href: "/dashboard/pending-requests",
      hint:
        pending === 0
          ? "No customer texts waiting"
          : pending === 1
            ? "Approve or decline before it affects the route"
            : "Approve or decline before they affect routes",
      alert: pending > 0,
      accent:
        pending > 0
          ? "border-l-amber-500 bg-amber-50/70"
          : "border-l-stone-300",
      cta: pending > 0 ? "Review texts" : "View inbox",
    },
    {
      title: "Tomorrow",
      value:
        tomorrowCounts.dogs === 1
          ? "1 dog"
          : `${tomorrowCounts.dogs} dogs`,
      href: "/dashboard/hikes/tomorrow",
      hint: daySummaryHint(tomorrowCounts),
      accent: "border-l-[var(--color-sky)] bg-sky-50/40",
      cta: "Plan tomorrow",
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
      title: "Weekly routes",
      value: String(routeCount ?? 0),
      href: "/dashboard/route",
      hint: "Pickup order, drivers & vans",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Overview"
        description={`${formatDateLabel(today, tz)} — who’s on the vans and what needs attention.`}
        action={<PrimaryLink href="/dashboard/hikes/today">Open today</PrimaryLink>}
      />

      {pending > 0 ? (
        <Link
          href="/dashboard/pending-requests"
          className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 motion-interactive hover:border-amber-300"
        >
          <span>
            <strong className="font-semibold">
              {pending} customer text{pending === 1 ? "" : "s"} waiting
            </strong>
            <span className="mt-0.5 block text-amber-900/80">
              Approve or decline before the route changes.
            </span>
          </span>
          <span className="shrink-0 font-semibold text-amber-900">Review →</span>
        </Link>
      ) : null}

      <section aria-labelledby="dashboard-operations-heading">
        <h2
          id="dashboard-operations-heading"
          className="mb-3 text-sm font-medium uppercase tracking-wide text-stone-500"
        >
          Today &amp; schedule
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {operationsCards.map((card) => (
            <Link key={card.href} href={card.href} className="group">
              <Card
                className={`border-l-4 ${card.accent} transition group-hover:shadow-[var(--elevation-2)]`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-stone-500">
                    {card.title}
                  </p>
                  {card.alert ? (
                    <Badge tone="amber">Action needed</Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
                  {card.value}
                </p>
                <p className="mt-1 text-sm text-stone-500">{card.hint}</p>
                <p className="mt-4 text-sm font-semibold text-[var(--color-trail-700)]">
                  {card.cta} →
                </p>
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
            <Link key={card.href} href={card.href} className="group">
              <Card className="transition group-hover:shadow-[var(--elevation-2)]">
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

      <section
        aria-labelledby="dashboard-quick-actions-heading"
        className="mt-10"
      >
        <h2
          id="dashboard-quick-actions-heading"
          className="mb-3 text-sm font-medium uppercase tracking-wide text-stone-500"
        >
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/customers/new"
            className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow-sm motion-interactive hover:border-[var(--color-trail-600)] hover:text-[var(--color-trail-700)]"
          >
            Add customer
          </Link>
          <Link
            href="/dashboard/dogs/new"
            className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow-sm motion-interactive hover:border-[var(--color-trail-600)] hover:text-[var(--color-trail-700)]"
          >
            Add dog
          </Link>
          <Link
            href="/dashboard/billing"
            className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow-sm motion-interactive hover:border-[var(--color-trail-600)] hover:text-[var(--color-trail-700)]"
          >
            Hike report
          </Link>
          <Link
            href="/dashboard/help"
            className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow-sm motion-interactive hover:border-[var(--color-trail-600)] hover:text-[var(--color-trail-700)]"
          >
            Help &amp; guide
          </Link>
        </div>
      </section>
    </div>
  );
}
