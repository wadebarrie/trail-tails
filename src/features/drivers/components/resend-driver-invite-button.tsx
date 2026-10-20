"use client";

import { useState, useTransition } from "react";
import { resendDriverInviteAction } from "@/features/drivers/actions";

export function ResendDriverInviteButton({ driverId }: { driverId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
      <p className="text-sm text-stone-700">
        Invite links expire. Send a fresh email so the driver can set their own
        password.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          setMessage(null);
          startTransition(async () => {
            const result = await resendDriverInviteAction(driverId);
            if (result.error) {
              setError(result.error);
              return;
            }
            setMessage("Invite email sent.");
          });
        }}
        className="mt-3 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Resend invite"}
      </button>
      {message ? <p className="mt-2 text-sm text-green-800">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
