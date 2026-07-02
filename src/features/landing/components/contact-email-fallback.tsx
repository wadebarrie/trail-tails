"use client";

import { useState } from "react";
import { SITE_CONTACT_EMAIL } from "@/lib/seo/metadata";

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
    try {
      await navigator.clipboard.writeText(SITE_CONTACT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this email address:", SITE_CONTACT_EMAIL);
    }
  }

  const muted =
    variant === "dark" ? "text-white/60" : "text-stone-500";
  const link =
    variant === "dark"
      ? "text-white/90 hover:text-white"
      : "text-[var(--color-trail-700)] hover:text-[var(--color-trail-800)]";
  const button =
    variant === "dark"
      ? "text-white/70 hover:text-white"
      : "text-stone-600 hover:text-[var(--color-trail-700)]";

  return (
    <p className={`text-sm ${muted} ${className}`}>
      Or email{" "}
      <a href={`mailto:${SITE_CONTACT_EMAIL}`} className={`font-medium ${link}`}>
        {SITE_CONTACT_EMAIL}
      </a>
      {" · "}
      <button
        type="button"
        onClick={copyEmail}
        className={`font-medium underline-offset-2 hover:underline ${button}`}
      >
        {copied ? "Copied!" : "Copy address"}
      </button>
    </p>
  );
}
