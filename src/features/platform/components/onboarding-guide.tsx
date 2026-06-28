import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";

export function OnboardingGuide() {
  const appUrl = getSiteUrl();

  return (
    <section className="rounded-xl border border-stone-200 bg-white">
      <div className="border-b border-stone-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-stone-900">Beta onboarding guide</h2>
        <p className="mt-1 text-sm text-stone-600">
          Invite-only flow for new dog hiking companies. Public signup is disabled —
          every tenant starts here.
        </p>
      </div>

      <div className="space-y-8 px-5 py-5 text-sm text-stone-700">
        <GuideBlock title="Your steps (platform owner)">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Fill in the form below: company name, admin name, admin email, and
              timezone.
            </li>
            <li>
              Click <strong>Create company &amp; invite</strong>. Copy the one-time
              invite URL from the green box.
            </li>
            <li>
              Send the link to the new admin by email or Slack. It expires in{" "}
              <strong>7 days</strong> and works only once.
            </li>
            <li>
              After they sign up, track the company on{" "}
              <Link href="/owner" className="font-medium text-[var(--color-trail-700)] hover:underline">
                Overview
              </Link>{" "}
              or open their row to set plan, trial end date, and monthly subscription.
            </li>
          </ol>
        </GuideBlock>

        <GuideBlock title="What the new admin does">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Open the invite link → <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">{appUrl}/signup?token=…</code>
            </li>
            <li>
              Create a password (at least 12 characters, with a letter and a number).
            </li>
            <li>
              Sign in at{" "}
              <Link href="/login" className="font-medium text-[var(--color-trail-700)] hover:underline">
                {appUrl}/login
              </Link>
              .
            </li>
            <li>
              On first login, scan the QR code with an authenticator app (1Password,
              Authy, Google Authenticator, etc.) and enter the 6-digit code.{" "}
              <strong>TOTP is required for all admin accounts.</strong>
            </li>
            <li>
              On later logins: password, then authenticator code.
            </li>
            <li>
              Set up their company in the office dashboard — customers, dogs, routes,
              drivers. For white-glove onboarding, use{" "}
              <strong>People → Import</strong> to upload a CSV of their customer list.
            </li>
          </ol>
        </GuideBlock>

        <GuideBlock title="Adding drivers (after admin is live)">
          <p>
            Tenant admins add drivers from{" "}
            <strong>Dashboard → Drivers → Add driver</strong>. Each driver gets a login
            email and temporary password you share securely. Drivers use{" "}
            <Link
              href="/login?role=driver"
              className="font-medium text-[var(--color-trail-700)] hover:underline"
            >
              {appUrl}/login?role=driver
            </Link>{" "}
            and land on the mobile <strong>Today</strong> view. Drivers do{" "}
            <strong>not</strong> use MFA during beta.
          </p>
        </GuideBlock>

        <GuideBlock title="Trial &amp; billing tracking">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              New companies start on the <strong>trial</strong> plan with a 30-day trial
              end date (editable per company).
            </li>
            <li>
              Set monthly subscription (in cents) on the{" "}
              <Link href="/owner" className="font-medium text-[var(--color-trail-700)] hover:underline">
                company detail page
              </Link>{" "}
              when they convert — no payment processing, tracking only.
            </li>
            <li>
              Usage and estimated margin appear on the Overview dashboard once they
              start sending SMS and completing hikes.
            </li>
          </ul>
        </GuideBlock>

        <GuideBlock title="Before they go live with customers">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Assign a Twilio number to the company (Supabase{" "}
              <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">companies.twilio_phone_number</code>{" "}
              or company settings when exposed in UI).
            </li>
            <li>
              Confirm <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_APP_URL</code>{" "}
              is set to <strong>{appUrl}</strong> so invite links and webhooks resolve
              correctly.
            </li>
            <li>
              Walk them through adding one test customer and dog before turning on real
              SMS.
            </li>
          </ul>
        </GuideBlock>

        <GuideBlock title="Troubleshooting">
          <dl className="space-y-3">
            <div>
              <dt className="font-medium text-stone-900">Invite link invalid or expired</dt>
              <dd className="mt-0.5 text-stone-600">
                Create a new company invite below. Old links cannot be reused after
                acceptance.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-stone-900">“Account already exists”</dt>
              <dd className="mt-0.5 text-stone-600">
                They should sign in at /login instead. If they never finished MFA, they
                will be prompted on login.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-stone-900">MFA setup fails</dt>
              <dd className="mt-0.5 text-stone-600">
                Confirm TOTP is enabled in Supabase → Authentication → MFA. Admin can
                retry at /dashboard/mfa.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-stone-900">Admin cannot see Owner / superadmin</dt>
              <dd className="mt-0.5 text-stone-600">
                Expected — only your platform owner account has /owner access. Tenant
                admins never see cross-company data.
              </dd>
            </div>
          </dl>
        </GuideBlock>
      </div>
    </section>
  );
}

function GuideBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-semibold text-stone-900">{title}</h3>
      <div className="mt-2 leading-relaxed">{children}</div>
    </div>
  );
}
