"use client";

import { SITE_CONTACT_EMAIL } from "@/lib/seo/metadata";
import {
  copyContactEmail,
  DEMO_EMAIL_SUBJECT,
  gmailComposeUrl,
} from "@/features/landing/contact-email-actions";

export function FooterContactEmail() {
  async function handleClick() {
    await copyContactEmail();
  }

  return (
    <a
      href={gmailComposeUrl(SITE_CONTACT_EMAIL, DEMO_EMAIL_SUBJECT)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="mt-2 inline-block text-sm font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
    >
      {SITE_CONTACT_EMAIL}
    </a>
  );
}
