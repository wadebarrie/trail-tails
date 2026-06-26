"use client";

import { useCallback, useEffect, useState } from "react";

export type GeolocationServiceStatus =
  | "checking"
  | "unsupported"
  | "denied"
  | "prompt"
  | "waiting"
  | "active";

export function useGeolocationStatus(enabled = true) {
  const [status, setStatus] = useState<GeolocationServiceStatus>("checking");

  const probe = useCallback(() => {
    if (!enabled) return;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => setStatus("active"),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setStatus("denied");
        } else if (error.code === error.TIMEOUT) {
          setStatus("waiting");
        } else {
          setStatus("waiting");
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 }
    );
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setStatus("checking");
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }

    let cancelled = false;
    setStatus("checking");

    async function syncFromPermission() {
      try {
        const result = await navigator.permissions.query({
          name: "geolocation",
        });

        const applyState = () => {
          if (cancelled) return;
          if (result.state === "denied") {
            setStatus("denied");
          } else if (result.state === "prompt") {
            setStatus("prompt");
          } else {
            probe();
          }
        };

        applyState();
        result.addEventListener("change", applyState);
        return () => result.removeEventListener("change", applyState);
      } catch {
        probe();
        return undefined;
      }
    }

    let removePermissionListener: (() => void) | undefined;
    void syncFromPermission().then((remove) => {
      removePermissionListener = remove;
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") probe();
    };
    document.addEventListener("visibilitychange", onVisible);

    const intervalId = window.setInterval(probe, 30000);

    return () => {
      cancelled = true;
      removePermissionListener?.();
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(intervalId);
    };
  }, [enabled, probe]);

  return { status, recheck: probe };
}
