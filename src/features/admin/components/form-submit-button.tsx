"use client";

import { useFormStatus } from "react-dom";

const primaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--color-trail-700)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-trail-600)] disabled:cursor-not-allowed disabled:opacity-50";

export function FormSubmitButton({
  children,
  pendingLabel,
  className = "",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${primaryButtonClassName} ${className}`.trim()}
    >
      {pending ? (pendingLabel ?? "Saving…") : children}
    </button>
  );
}
