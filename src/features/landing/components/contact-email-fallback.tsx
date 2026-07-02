"use client";

import { useState } from "react";
import { SITE_CONTACT_EMAIL } from "@/lib/seo/metadata";
import {
  copyContactEmail,
  gmailComposeUrl,
  outlookComposeUrl,
  DEMO_EMAIL_SUBJECT,
} from "@/features/landing/contact-email-actions";

type ContactEmailFallbackProps = {
  /** Text on light sections (hero). */
  variant?: "light" | "dark";
  className?: string;
};

export function ContactEmailFallback({
  variant = "light",
  className = "",
}: ContactEmailFallbackProps) {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    const ok = await copyContactEmail();
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      window.prompt("Copy this email address:", SITE_CONTACT_EMAIL);
    }
  }

  const muted =
    variant === "dark" ? "text-white/60" : "text-stone-500";
  const link =
    variant === "dark"
      ? "text-white/90 hover:text-white"
      : "text-[var(--color-trail-700)] hover:text-[var(--color-trail-800)]";

  return (
    <p className={`text-sm ${muted} ${className}`}>
      Or email{" "}
      <span className="font-medium text-inherit">{SITE_CONTACT_EMAIL}</span>
      {" · "}
      <a
        href={gmailComposeUrl(SITE_CONTACT_EMAIL, DEMO_EMAIL_SUBJECT)}
        target="_blank"
        rel="noopener noreferrer"
        className={`font-medium underline-offset-2 hover:underline ${link}`}
      >
        Gmail
      </a>
      {" · "}
      <a
        href={outlookComposeUrl(SITE_CONTACT_EMAIL, DEMO_EMAIL_SUBJECT)}
        target="_blank"
        rel="noopener noreferrer"
        className={`font-medium underline-offset-2 hover:underline ${link}`}
      >
        Outlook
      </a>
      {" · "}
      <button
        type="button"
        onClick={copyEmail}
        className={`font-medium underline-offset-2 hover:underline ${link}`}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </p>
  );
}
