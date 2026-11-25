"use client";

import { useFormStatus } from "react-dom";
import { primaryButtonClassName } from "@/features/admin/components/button-styles";

export function FormSubmitButton({
  children,
  pendingLabel,
  className = "",
  disabled = false,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={`${primaryButtonClassName} ${className}`.trim()}
    >
      {pending ? (pendingLabel ?? "Saving…") : children}
    </button>
  );
}
