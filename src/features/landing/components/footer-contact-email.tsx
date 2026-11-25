import Link from "next/link";
import { SITE_CONTACT_EMAIL } from "@/lib/seo/metadata";

export function FooterContactEmail() {
  return (
    <Link
      href="/demo"
      className="mt-2 inline-block text-sm font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
    >
      {SITE_CONTACT_EMAIL}
    </Link>
  );
}
