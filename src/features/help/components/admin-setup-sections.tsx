import Link from "next/link";

type AdminSetupSectionsProps = {
  Section: React.ComponentType<{
    id: string;
    title: string;
    variant: "admin";
    children: React.ReactNode;
  }>;
};

export function AdminSetupSections({ Section }: AdminSetupSectionsProps) {
  return (
    <>
      <Section id="getting-started" title="Getting started" variant="admin">
        <p>
          Welcome to PackRoute. After you accept your invite and create a password,
          your first sign-in will ask you to set up an{" "}
          <strong>authenticator app (TOTP)</strong> for two-factor security. You will
          need this code every time you sign in to the office dashboard.
        </p>
        <p>
          <strong>Recommended setup order</strong> before your first real hike:
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Review{" "}
            <Link href="/dashboard/settings" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Settings
            </Link>{" "}
            — default hike price and night-before reminder time (default 7:30 PM local).
          </li>
          <li>
            Add{" "}
            <Link href="/dashboard/customers" className="font-medium text-[var(--color-trail-700)] hover:underline">
              customers
            </Link>{" "}
            with a complete street address (needed for geocoding and ETA texts), or use{" "}
            <Link href="/dashboard/import" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Bulk import
            </Link>{" "}
            to upload a CSV.
          </li>
          <li>
            Add{" "}
            <Link href="/dashboard/dogs" className="font-medium text-[var(--color-trail-700)] hover:underline">
              dogs
            </Link>
            . Choose <strong>Recurring</strong> (regular route + expected days) or{" "}
            <strong>As-needed</strong> (booked onto specific days from Today/Tomorrow).
          </li>
          <li>
            Configure{" "}
            <Link href="/dashboard/route" className="font-medium text-[var(--color-trail-700)] hover:underline">
              routes
            </Link>{" "}
            — weekday schedule, stop order, and default driver per route.
          </li>
          <li>
            Add{" "}
            <Link href="/dashboard/drivers" className="font-medium text-[var(--color-trail-700)] hover:underline">
              drivers
            </Link>{" "}
            and share their login details (see below).
          </li>
          <li>
            Open{" "}
            <Link href="/dashboard/hikes/today" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Today
            </Link>{" "}
            /{" "}
            <Link href="/dashboard/hikes/tomorrow" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Tomorrow
            </Link>{" "}
            to confirm stops generated correctly before going live with SMS.
          </li>
        </ol>
        <p className="text-xs text-stone-500">
          Recurring dogs sync automatically from routes. As-needed dogs are added to
          specific days from Today or Tomorrow. Stops for today and tomorrow refresh
          when routes or schedules change.
        </p>
      </Section>

      <Section id="team" title="Adding drivers" variant="admin">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Go to{" "}
            <Link href="/dashboard/drivers" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Drivers
            </Link>{" "}
            → <strong>Add driver</strong>.
          </li>
          <li>
            Enter their full name, login email, and a temporary password (at least 8
            characters).
          </li>
          <li>
            Share the login link and password securely — send them to{" "}
            <Link href="/login?role=driver" className="font-medium text-[var(--color-trail-700)] hover:underline">
              the driver sign-in page
            </Link>
            . Drivers use the mobile <strong>Today</strong> view; they do not need an
            app store install.
          </li>
          <li>
            On{" "}
            <Link href="/dashboard/route" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Routes
            </Link>
            , set each route&apos;s <strong>default driver</strong> so Today/Tomorrow
            pre-assign the right person.
          </li>
          <li>
            You can override the driver for a specific day from Today or Tomorrow if
            someone is covering a route.
          </li>
        </ol>
        <p>
          <strong>Updating drivers:</strong> open the driver from the list to change
          name, phone, or active status. Login email cannot be changed in the
          dashboard — contact PackRoute support if a driver needs a new email.
        </p>
        <p>
          <strong>Deactivating:</strong> turn off <strong>Active</strong> on a driver
          profile to block sign-in without deleting their history.
        </p>
        <p className="text-xs text-stone-500">
          Drivers do not use two-factor authentication during beta. Only office admin
          accounts require an authenticator app.
        </p>
      </Section>

      <Section id="customers-routes" title="Customers, dogs & routes" variant="admin">
        <h3 className="font-semibold text-stone-900">Customers</h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Add from{" "}
            <Link href="/dashboard/customers" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Customers → Add customer
            </Link>
            , or use{" "}
            <Link href="/dashboard/import" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Bulk import
            </Link>{" "}
            to upload a CSV when onboarding many clients at once.
          </li>
          <li>
            Phone number must be unique per company — this is the SMS number.
          </li>
          <li>
            Enter a full street address. PackRoute geocodes it for ETA and auto-arrival.
            If geocoding fails, re-save the address or check for typos.
          </li>
          <li>
            Optional second contact: add a secondary phone if both owners should receive
            texts and can send schedule requests.
          </li>
          <li>
            <strong>Night-before reminder texts</strong> are on by default. Send time
            is set in{" "}
            <Link href="/dashboard/settings" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Settings
            </Link>{" "}
            (default 7:30 PM local). Customers can text STOP REMINDERS / START
            REMINDERS, or you can toggle this on their profile when editing a customer.
          </li>
        </ul>

        <h3 className="pt-3 font-semibold text-stone-900">Bulk import (CSV)</h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Download the template from{" "}
            <Link href="/dashboard/import" className="font-medium text-[var(--color-trail-700)] hover:underline">
              People → Import
            </Link>
            . One row per dog; repeat the customer phone for additional dogs.
          </li>
          <li>
            Export current data from the same page to edit in Excel or Google Sheets,
            then re-upload to update records.
          </li>
          <li>
            Route names in the CSV must match existing routes, or leave blank and assign
            later from the Dogs page.
          </li>
        </ul>

        <h3 className="pt-3 font-semibold text-stone-900">Dogs</h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Each dog belongs to one customer. Set a default pickup window — this is a
            starting point when building a daily route plan, not a fixed ETA.
          </li>
          <li>
            <strong>Recurring</strong> dogs are assigned to a route with expected
            availability days. They appear automatically when that route runs.
          </li>
          <li>
            <strong>As-needed</strong> dogs are known customers booked manually onto a
            specific day from{" "}
            <Link href="/dashboard/hikes/today" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Today
            </Link>{" "}
            or{" "}
            <Link href="/dashboard/hikes/tomorrow" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Tomorrow
            </Link>
            . They do not auto-generate on recurring schedules.
          </li>
          <li>
            Optional <strong>drop-off window</strong> on the dog profile. Most
            companies leave afternoon drop-offs flexible with no planned window.
          </li>
          <li>
            Per-dog hike rate overrides the company default for billing export.
          </li>
        </ul>

        <h3 className="pt-3 font-semibold text-stone-900">Routes</h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Routes group dogs that ride together. Set which weekdays each route runs on{" "}
            <Link href="/dashboard/route" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Routes
            </Link>
            .
          </li>
          <li>
            Assign <strong>recurring</strong> dogs to each route. Drag to set default
            pickup order. Drop-offs always run in the reverse of pickup order.
          </li>
          <li>
            Use{" "}
            <Link href="/dashboard/exceptions" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Exceptions
            </Link>{" "}
            for office-created skips, vacations, or pauses. Customer SMS requests still
            go through Pending requests first.
          </li>
        </ul>

        <h3 className="pt-3 font-semibold text-stone-900">Daily route plan (Today / Tomorrow)</h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Link href="/dashboard/hikes/today" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Today
            </Link>{" "}
            and{" "}
            <Link href="/dashboard/hikes/tomorrow" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Tomorrow
            </Link>{" "}
            are where you build each day&apos;s manifest — who is actually hiking,
            planned pickup order, and planned windows for that day only.
          </li>
          <li>
            Add <strong>as-needed</strong> dogs to a route for that specific day.
            Removing them from the day does not change their long-term profile.
          </li>
          <li>
            Reorder pickups or edit planned windows per stop. Changes stay on that
            day&apos;s plan and are not overwritten when routes sync.
          </li>
          <li>
            Assign or override the driver for each route. Mark a hike complete from
            Today if the driver finished but did not close out.
          </li>
          <li>
            Today shows only the current day — past hikes are not listed here.
          </li>
        </ul>

        <h3 className="pt-3 font-semibold text-stone-900">Other daily tools</h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Link href="/dashboard/billing" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Billing
            </Link>{" "}
            — export completed hikes by date range for invoicing (PackRoute does not
            process payments).
          </li>
          <li>
            <Link href="/dashboard/help#sms" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Customer SMS
            </Link>{" "}
            — full command list, reminder opt-in/out, and pending-request workflow.
          </li>
        </ul>
      </Section>

      <Section id="security" title="Account security (admins)" variant="admin">
        <p>
          Office admins must use an authenticator app (1Password, Authy, Google
          Authenticator, etc.) when signing in. If you replace your phone or lose access,
          contact PackRoute support before you are locked out.
        </p>
        <p>
          Forgot your password? Use{" "}
          <Link href="/forgot-password" className="font-medium text-[var(--color-trail-700)] hover:underline">
            Forgot password
          </Link>{" "}
          on the sign-in page. After resetting, sign in again with your authenticator
          app.
        </p>
        <p>
          To review or re-enroll MFA, open{" "}
          <Link href="/dashboard/mfa" className="font-medium text-[var(--color-trail-700)] hover:underline">
            two-factor settings
          </Link>{" "}
          from the dashboard (you may be redirected there automatically if setup is
          incomplete).
        </p>
        <p className="text-xs text-stone-500">
          Never share your admin password or authenticator codes. Drivers have separate
          accounts with their own passwords.
        </p>
      </Section>
    </>
  );
}
