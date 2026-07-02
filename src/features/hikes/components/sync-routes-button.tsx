"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { syncHikesForOffsetAction } from "@/features/hikes/actions";
import { secondaryButtonClassName } from "@/features/admin/components/button-styles";

export function SyncRoutesButton({ offsetDays }: { offsetDays: 0 | 1 }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSync() {
    startTransition(async () => {
      const result = await syncHikesForOffsetAction(offsetDays);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={pending}
      className={secondaryButtonClassName}
    >
      {pending ? "Syncing…" : "Refresh routes"}
    </button>
  );
}
