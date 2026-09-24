"use client";

import { useState } from "react";
import { trackEvent } from "@/features/landing/analytics";
import {
  copyContactEmail,
  gmailComposeUrl,
} from "@/features/landing/contact-email-actions";
import { SITE_CONTACT_EMAIL } from "@/lib/seo/metadata";

type ContactEmailButtonProps = {
  subject: string;
  label: string;
  className?: string;
  successLabel?: string;
  /** GA4 event name when the button is clicked. */
  eventName?: string;
  /** GA4 event location parameter. */
  eventLocation?: string;
};

export function ContactEmailButton({
  subject,
  label,
  className,
  successLabel = "Compose opened",
  eventName,
  eventLocation,
}: ContactEmailButtonProps) {
  const [opened, setOpened] = useState(false);

  async function handleClick() {
    if (eventName) {
      trackEvent(eventName, {
        location: eventLocation,
        subject,
      });
    }
    await copyContactEmail();
    setOpened(true);
    window.setTimeout(() => setOpened(false), 2500);
  }

  return (
    <a
      href={gmailComposeUrl(SITE_CONTACT_EMAIL, subject)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
    >
      {opened ? successLabel : label}
    </a>
  );
}
