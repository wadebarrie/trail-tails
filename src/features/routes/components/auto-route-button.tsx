"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { secondaryButtonClassName } from "@/features/admin/components/button-styles";

type AutoRouteButtonProps = {
  label?: string;
  onAutoRoute: () => Promise<{
    error?: string;
    success?: boolean;
    missingCoords?: number;
  }>;
};

export function AutoRouteButton({
  label = "Auto-route",
  onAutoRoute,
}: AutoRouteButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      setMessage(null);
      setError(null);

      const result = await onAutoRoute();

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.missingCoords && result.missingCoords > 0) {
        setMessage(
          `Route sorted. ${result.missingCoords} stop${result.missingCoords === 1 ? "" : "s"} without GPS were kept at the end — geocode those addresses for better results.`
        );
      } else {
        setMessage("Route sorted by proximity.");
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={secondaryButtonClassName}
      >
        {pending ? "Sorting…" : label}
      </button>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="text-sm text-stone-600">{message}</p> : null}
    </div>
  );
}
