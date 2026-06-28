import Link from "next/link";
import { Card } from "@/features/admin/components/ui";
import { AdminSetupSections } from "@/features/help/components/admin-setup-sections";
import {
  CUSTOMER_EXPLAINER,
  SMS_COMMANDS,
  SMS_OVERVIEW,
} from "@/features/help/sms-commands";

type HelpGuideProps = {
  variant: "admin" | "driver";
  backHref: string;
  backLabel: string;
};

function Section({
  id,
  title,
  variant,
  children,
}: {
  id: string;
  title: string;
  variant: "admin" | "driver";
  children: React.ReactNode;
}) {
  if (variant === "admin") {
    return (
      <section id={id} className="scroll-mt-6">
        <h2 className="mb-3 text-lg font-semibold text-stone-900">{title}</h2>
        <Card className="space-y-4 text-sm text-stone-700">{children}</Card>
      </section>
    );
  }

  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="mb-3 text-lg font-semibold text-white">{title}</h2>
      <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
        {children}
      </div>
    </section>
  );
}

function CommandList({ variant }: { variant: "admin" | "driver" }) {
  const exampleClass =
    variant === "admin"
      ? "font-mono text-xs text-[var(--color-trail-800)]"
      : "font-mono text-xs text-green-200";

  return (
    <ul className="space-y-4">
      {SMS_COMMANDS.map((cmd) => (
        <li key={cmd.examples[0]}>
          <p className="font-medium">{cmd.meaning}</p>
          <p className={`mt-1 ${exampleClass}`}>{cmd.examples.join(" · ")}</p>
          {cmd.note ? <p className="mt-1 text-xs opacity-80">{cmd.note}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export function HelpGuide({ variant, backHref, backLabel }: HelpGuideProps) {
  const isAdmin = variant === "admin";
  const tocClass = isAdmin
    ? "text-[var(--color-trail-700)] hover:underline"
    : "text-green-300 hover:underline";

  return (
    <div className={isAdmin ? "" : "max-w-2xl"}>
      <Link
        href={backHref}
        className={
          isAdmin
            ? "mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-[var(--color-trail-700)] hover:underline"
            : "mb-6 inline-flex min-h-11 items-center text-sm text-green-300 hover:underline"
        }
      >
        <span aria-hidden>←</span> {backLabel}
      </Link>

      <h1 className={`text-2xl font-semibold ${isAdmin ? "text-stone-900" : "text-white"}`}>
        Help &amp; guide
      </h1>
      <p className={`mt-2 text-sm ${isAdmin ? "text-stone-600" : "text-white/70"}`}>
        {isAdmin
          ? "Setup checklists, driver onboarding, daily operations, SMS, and troubleshooting."
          : "How PackRoute works, driver tips, location troubleshooting, and what to tell customers about SMS."}
      </p>

      <nav
        aria-label="On this page"
        className={`mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm ${isAdmin ? "" : "text-white/80"}`}
      >
        {(isAdmin
          ? [
              ["getting-started", "Getting started"],
              ["team", "Adding drivers"],
              ["customers-routes", "Customers & routes"],
              ["security", "Account security"],
              ["overview", "Overview"],
              ["driver", "Driver app"],
              ["location", "Location / GPS"],
              ["sms", "Customer SMS"],
              ["explainer", "Customer script"],
            ]
          : [
              ["overview", "Overview"],
              ["driver", "Driver app"],
              ["location", "Location / GPS"],
              ["sms", "Customer SMS"],
              ["explainer", "Customer script"],
            ]
        ).map(([id, label]) => (
          <a key={id} href={`#${id}`} className={tocClass}>
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-8 space-y-10">
        {isAdmin ? <AdminSetupSections Section={Section} /> : null}
        <Section id="overview" title="How PackRoute works" variant={variant}>
          <p>
            <strong>Admin (office)</strong> sets up customers, dogs, routes, and drivers.
            Routes define which days a hike runs and which dogs are on each route. Each
            morning, stops sync automatically for today and tomorrow.
          </p>
          <p>
            <strong>Drivers</strong> use the mobile Today view to run pickups and
            drop-offs. Tapping <strong>En Route</strong> texts the customer an ETA.
            Arrival can be detected automatically when location is enabled.
          </p>
          <p>
            <strong>Customers</strong> receive automated texts (night-before reminder,
            on the way, picked up / dropped off). They can reply to request schedule
            changes — those land in Admin → Pending requests for approval.
          </p>
          {isAdmin ? (
            <p>
              Use <strong>Today / Tomorrow</strong> to assign drivers and reorder stops.
              Use <strong>Routes</strong> for weekday schedules and dog order. Mark hikes
              complete from Today when a driver forgets to close out.
            </p>
          ) : null}
        </Section>

        <Section id="driver" title="Driver app — daily workflow" variant={variant}>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Open <strong>Today</strong> before the hike. Confirm your route and stop count.</li>
            <li>
              Enable location when prompted (green <strong>Location active</strong> pill).
            </li>
            <li>
              At each pickup: tap <strong>En Route</strong> when leaving for the stop
              (customer gets an ETA text).
            </li>
            <li>
              When you arrive, the app can auto-detect arrival within ~150 m, or tap{" "}
              <strong>Mark arrived</strong> manually.
            </li>
            <li>Tap <strong>Picked up</strong> / <strong>Dropped off</strong> to confirm each stop.</li>
            <li>
              <strong>Tomorrow</strong> is preview-only — actions unlock on the day of
              the hike.
            </li>
          </ol>
          <p className="text-xs opacity-80">
            Pickup order can be adjusted by dragging on Today if the office enabled
            reordering for your route.
          </p>
        </Section>

        <Section id="location" title="Location / GPS troubleshooting" variant={variant}>
          <p>The location pill at the top of Today shows your GPS status:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Location active</strong> (green) — auto-arrival and trip progress
              work.
            </li>
            <li>
              <strong>Location not enabled</strong> (amber) — tap the pill to retry, or
              enable location in browser settings.
            </li>
            <li>
              <strong>Location blocked</strong> (red) — permission was denied. On iPhone:
              Settings → Safari → Location → Allow. On Android Chrome: site settings →
              Location → Allow.
            </li>
            <li>
              <strong>Acquiring GPS…</strong> — wait a few seconds outdoors; keep the
              screen on during the drive to the stop.
            </li>
          </ul>
          <p>
            <strong>Chrome on iPhone:</strong> use Precise Location when prompted. If auto-arrival
            still fails, use <strong>Mark arrived</strong> — the hike still completes normally.
          </p>
          <p>
            <strong>No GPS on file for an address</strong> means the customer address
            was not geocoded — auto-arrival cannot run for that stop; tap manually.
            {isAdmin ? " Re-save the customer address in Admin → Customers to geocode." : " Tell the office to update the address."}
          </p>
        </Section>

        <Section id="sms" title="Customer SMS — how it works" variant={variant}>
          <p>{SMS_OVERVIEW.phone}</p>
          <p>{SMS_OVERVIEW.review}</p>
          <p>{SMS_OVERVIEW.help}</p>
          <p>{SMS_OVERVIEW.ack}</p>

          <h3 className={`pt-2 font-semibold ${isAdmin ? "text-stone-900" : "text-white"}`}>
            Commands customers can text
          </h3>
          <CommandList variant={variant} />

          {isAdmin ? (
            <>
              <h3 className="pt-2 font-semibold text-stone-900">Admin workflow</h3>
              <ol className="list-decimal space-y-2 pl-5">
                <li>Inbound texts appear in Admin → SMS and create a pending request.</li>
                <li>Review the raw message in Admin → Pending requests.</li>
                <li>Approve to apply schedule exceptions and refresh stops, or decline with an optional note.</li>
                <li>Approved changes sync Today / Tomorrow automatically.</li>
              </ol>
              <p className="text-xs text-stone-500">
                Night-before reminders send around 6 PM local time the day before a hike.
              </p>
            </>
          ) : null}
        </Section>

        <Section id="explainer" title="Script — explaining SMS to a customer" variant={variant}>
          <p className={isAdmin ? "rounded-lg bg-stone-50 p-4 italic text-stone-800" : "rounded-lg bg-white/5 p-4 italic text-white/90"}>
            {CUSTOMER_EXPLAINER}
          </p>
          <p className="text-xs opacity-80">
            Tip: tell them to text HELP from the phone number on their account. Second
            contacts on the same household can text from either number.
          </p>
        </Section>
      </div>
    </div>
  );
}
