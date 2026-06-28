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
            — company name, timezone, and pickup windows.
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
            , assign each to a route, and set their weekly schedule days.
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
          Stops for today and tomorrow sync automatically from your routes and
          schedules. You do not need to build each hike manually.
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
            Each dog belongs to one customer. Set pickup window times and which{" "}
            <strong>days of the week</strong> they hike.
          </li>
          <li>
            Assign a <strong>route</strong> for the dog. Unassigned dogs will not appear
            on daily stop lists.
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
            Drag to set stop order — drivers follow this sequence on Today.
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

        <h3 className="pt-3 font-semibold text-stone-900">Daily operations</h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Link href="/dashboard/hikes/today" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Today
            </Link>{" "}
            /{" "}
            <Link href="/dashboard/hikes/tomorrow" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Tomorrow
            </Link>{" "}
            — assign drivers, reorder stops for one day, mark hikes complete if a
            driver forgot to close out.
          </li>
          <li>
            <Link href="/dashboard/billing" className="font-medium text-[var(--color-trail-700)] hover:underline">
              Billing
            </Link>{" "}
            — export completed hikes by date range for invoicing (PackRoute does not
            process payments).
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
