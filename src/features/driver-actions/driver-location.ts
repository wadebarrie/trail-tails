/** Client-side last-known driver GPS for En Route ETA (and related actions). */

export type DriverLatLng = { lat: number; lng: number };

type CachedDriverLocation = DriverLatLng & { at: number };

/** Prefer a reading this fresh without waiting on a new fix. */
const FRESH_MS = 90_000;
/** Accept a remembered reading this old if a live fix fails. */
const STALE_OK_MS = 10 * 60_000;

let lastKnown: CachedDriverLocation | null = null;

export function rememberDriverLocation(lat: number, lng: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  lastKnown = { lat, lng, at: Date.now() };
}

export function getRememberedDriverLocation(
  maxAgeMs = STALE_OK_MS
): DriverLatLng | null {
  if (!lastKnown) return null;
  if (Date.now() - lastKnown.at > maxAgeMs) return null;
  return { lat: lastKnown.lat, lng: lastKnown.lng };
}

/**
 * Best-effort GPS for driver actions that need an ETA origin.
 * Uses a warm cache from page probes / prior watches, then refreshes live.
 */
export function getDriverLocationForAction(): Promise<DriverLatLng | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(getRememberedDriverLocation());
  }

  const fresh = getRememberedDriverLocation(FRESH_MS);
  const timeoutMs = fresh ? 2500 : 8000;

  return new Promise((resolve) => {
    let settled = false;

    const finish = (coords: DriverLatLng | null) => {
      if (settled) return;
      settled = true;
      if (coords) {
        rememberDriverLocation(coords.lat, coords.lng);
        resolve(coords);
        return;
      }
      resolve(getRememberedDriverLocation());
    };

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        finish({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => finish(null),
      {
        enableHighAccuracy: !fresh,
        timeout: timeoutMs,
        maximumAge: fresh ? FRESH_MS : 15_000,
      }
    );

    // Some browsers hang past timeout without calling the error callback.
    window.setTimeout(() => finish(null), timeoutMs + 500);
  });
}
