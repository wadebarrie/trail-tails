"use client";

import { useFormStatus } from "react-dom";
import { primaryButtonClassName } from "@/features/admin/components/button-styles";

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
