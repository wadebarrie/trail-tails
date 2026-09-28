import Link from "next/link";
import { SITE_CONTACT_EMAIL } from "@/lib/seo/metadata";
import {
  ACCOUNTING_ADDON_EMAIL_SUBJECT,
  gmailComposeUrl,
} from "@/features/landing/contact-email-actions";

/** Callout for paid QuickBooks / Xero sync — offered now, built on request. */
export function AccountingAddonsCard({
  compact = false,
}: {
  compact?: boolean;
}) {
  const mailto = gmailComposeUrl(
    SITE_CONTACT_EMAIL,
    ACCOUNTING_ADDON_EMAIL_SUBJECT
  );

  return (
    <section
      className={
        compact
          ? "rounded-xl border border-stone-200 bg-stone-50 p-4"
          : "mt-6 rounded-xl border border-stone-200 bg-white p-6"
      }
    >
      <h2
        className={
          compact
            ? "text-sm font-semibold text-stone-900"
            : "text-base font-semibold text-stone-900"
        }
      >
        QuickBooks &amp; Xero
      </h2>
      <p
        className={
          compact
            ? "mt-1 text-xs leading-relaxed text-stone-600"
            : "mt-2 text-sm leading-relaxed text-stone-600"
        }
      >
        CSV export is included. Live sync into QuickBooks Online or Xero is a{" "}
        <strong className="font-medium text-stone-800">paid add-on</strong> —
        ask us when you want it and we will enable it for your company.
      </p>
      <p className={compact ? "mt-2" : "mt-3"}>
        <a
          href={mailto}
          className="text-sm font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
        >
          Request QuickBooks or Xero sync
        </a>
        {!compact ? (
          <>
            {" · "}
            <Link
              href="/pricing"
              className="text-sm font-medium text-stone-600 underline-offset-2 hover:underline"
            >
              See pricing
            </Link>
          </>
        ) : null}
      </p>
    </section>
  );
}
