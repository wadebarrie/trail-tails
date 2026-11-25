"use client";

import { useState, useTransition } from "react";
import { secondaryButtonClassName } from "@/features/admin/components/button-styles";
import {
  deleteHikePhotoAction,
  revokeHikePhotoShareAction,
} from "@/features/hike-photos/actions";

export function DeletePhotoButton({ photoId }: { photoId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    if (!window.confirm("Delete this photo? Owners will no longer see it.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteHikePhotoAction(photoId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        aria-busy={pending}
        className={`${secondaryButtonClassName} !min-h-9 !px-3 !py-1.5 text-red-700`}
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function RevokeShareButton({ shareId }: { shareId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onRevoke() {
    if (!window.confirm("Revoke this link? The owner's gallery will stop working.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await revokeHikePhotoShareAction(shareId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={onRevoke}
        disabled={pending}
        className="text-sm text-red-700 underline-offset-2 hover:underline disabled:opacity-50"
      >
        {pending ? "Revoking…" : "Revoke"}
      </button>
      {error ? (
        <span role="alert" className="text-xs text-red-700">
          {error}
        </span>
      ) : null}
    </span>
  );
}
