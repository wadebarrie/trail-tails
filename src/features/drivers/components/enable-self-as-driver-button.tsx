"use client";

import { useState, useTransition } from "react";
import { enableSelfAsDriverAction } from "@/features/drivers/actions";
import { primaryButtonClassName } from "@/features/admin/components/button-styles";

export function EnableSelfAsDriverButton() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        className={primaryButtonClassName}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await enableSelfAsDriverAction();
            if (result.error) setError(result.error);
          });
        }}
      >
        {pending ? "Enabling…" : "Enable myself as a driver"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
