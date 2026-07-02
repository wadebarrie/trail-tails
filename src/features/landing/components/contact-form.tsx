"use client";

import { useState } from "react";
import { primaryButtonClassName } from "@/features/admin/components/button-styles";
import { FORMSPREE_ENDPOINT } from "@/features/landing/constants";

type ContactFormProps = {
  /** Light background (contact page) or dark section (landing CTA). */
  variant?: "light" | "dark";
  className?: string;
};

export function ContactForm({ variant = "light", className = "" }: ContactFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isDark = variant === "dark";

  const labelClass = isDark
    ? "block text-sm font-medium text-white/90"
    : "block text-sm font-medium text-stone-700";
  const inputClass = isDark
    ? "mt-1 w-full rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
    : "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-[var(--color-trail-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-trail-100)]";
  const errorClass = isDark
    ? "rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-200"
    : "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700";
  const successClass = isDark
    ? "rounded-lg bg-green-950/40 px-3 py-2 text-sm text-green-200"
    : "rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800";
  const buttonClass = isDark
    ? "inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-trail-800)] transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    : `${primaryButtonClassName} w-full sm:w-auto`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(false);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        setSuccess(true);
        form.reset();
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 text-left ${className}`}>
      <input type="hidden" name="_subject" value="PackRoute contact form" />

      {error ? <p className={errorClass}>{error}</p> : null}
      {success ? (
        <p className={successClass} role="status">
          Thanks — we&apos;ll get back to you soon.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className={labelClass}>
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className={labelClass}>
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          required
          placeholder="Tell us about your operation — demo, early access, or a question."
          className={inputClass}
        />
      </div>

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
