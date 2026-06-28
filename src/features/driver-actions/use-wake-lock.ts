"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps the screen awake while driving to a stop (Wake Lock API).
 * Re-acquires after unlock / tab focus — same moment GPS resumes.
 */
export function useWakeLock(enabled: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return;
    }

    let cancelled = false;

    async function acquire() {
      if (cancelled || document.visibilityState !== "visible") return;

      try {
        if (lockRef.current && !lockRef.current.released) {
          return;
        }
        lockRef.current = await navigator.wakeLock.request("screen");
        lockRef.current.addEventListener("release", () => {
          lockRef.current = null;
        });
      } catch {
        /* denied, low battery, or unsupported — manual Mark arrived still works */
      }
    }

    void acquire();

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void acquire();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void lockRef.current?.release();
      lockRef.current = null;
    };
  }, [enabled]);
}
