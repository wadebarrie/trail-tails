"use client";

import { useState, useTransition } from "react";
import {
  approvePendingRequestAction,
  declinePendingRequestAction,
} from "@/features/pending-requests/actions";

export function PendingRequestActions({ requestId }: { requestId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approvePendingRequestAction(requestId);
      if (!result.ok) setError(result.error);
    });
  }

  function handleDecline() {
    setError(null);
    const notes = window.prompt("Optional note for the customer (or leave blank):");
    if (notes === null) return;

    startTransition(async () => {
      const result = await declinePendingRequestAction(requestId, notes);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleApprove}
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={handleDecline}
        disabled={pending}
        className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
      >
        Decline
      </button>
      {error ? (
        <p className="w-full text-sm text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
