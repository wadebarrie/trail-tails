"use client";

import { useState, useTransition } from "react";
import { PrimaryButton, SecondaryButton } from "@/features/admin/components/ui";
import {
  approvePendingRequestAction,
  declinePendingRequestAction,
} from "@/features/pending-requests/actions";

export function PendingRequestActions({ requestId }: { requestId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approvePendingRequestAction(requestId);
      if (!result.ok) setError(result.error);
    });
  }

  function handleDeclineConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await declinePendingRequestAction(requestId, notes);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDeclineOpen(false);
      setNotes("");
    });
  }

  if (declineOpen) {
    return (
      <div className="mt-3 space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
        <label className="block text-sm font-medium text-stone-700">
          Optional note for the customer
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            placeholder="Reason for declining (optional)"
            className="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton
            type="button"
            onClick={handleDeclineConfirm}
            disabled={pending}
            className="min-h-10 px-3 py-1.5"
          >
            {pending ? "Declining…" : "Confirm decline"}
          </PrimaryButton>
          <SecondaryButton
            type="button"
            onClick={() => {
              setDeclineOpen(false);
              setNotes("");
              setError(null);
            }}
            disabled={pending}
            className="min-h-10 px-3 py-1.5"
          >
            Cancel
          </SecondaryButton>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <PrimaryButton
        type="button"
        onClick={handleApprove}
        disabled={pending}
        className="min-h-10 px-3 py-1.5"
      >
        {pending ? "Approving…" : "Approve"}
      </PrimaryButton>
      <SecondaryButton
        type="button"
        onClick={() => setDeclineOpen(true)}
        disabled={pending}
        className="min-h-10 px-3 py-1.5"
      >
        Decline
      </SecondaryButton>
      {error ? (
        <p className="w-full text-sm text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
