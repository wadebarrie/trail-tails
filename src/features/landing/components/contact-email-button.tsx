"use client";

import { useState } from "react";
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
};

export function ContactEmailButton({
  subject,
  label,
  className,
  successLabel = "Compose opened",
}: ContactEmailButtonProps) {
  const [opened, setOpened] = useState(false);

  async function handleClick() {
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
