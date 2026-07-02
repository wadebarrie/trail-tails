import { logWarn } from "@/lib/logger";
import { perfAsync } from "@/lib/perf";

export type LatLng = {
  lat: number;
  lng: number;
};

export type EtaResult = {
  durationMinutes: number;
  durationSeconds: number;
  distanceMeters: number;
};

type ComputeRoutesResponse = {
  routes?: {
    duration?: string;
    distanceMeters?: number;
  }[];
  error?: { message?: string; status?: string; code?: number };
};

function getApiKey(): string | null {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  return key || null;
}

export function isEtaConfigured(): boolean {
  return Boolean(getApiKey());
}

function isValidCoord(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidPoint(point: LatLng | null | undefined): point is LatLng {
  return point != null && isValidCoord(point.lat) && isValidCoord(point.lng);
}

function parseDurationSeconds(duration: string | undefined): number | null {
  if (!duration) return null;
  const match = /^(\d+(?:\.\d+)?)s$/.exec(duration.trim());
  if (!match) return null;
  const seconds = Number(match[1]);
  return Number.isFinite(seconds) ? seconds : null;
}

/**
 * Driving ETA via Routes API (traffic-aware).
 * @see https://developers.google.com/maps/documentation/routes/compute_route
 */
export async function getDrivingEta(
  origin: LatLng,
  destination: LatLng
): Promise<
  | { ok: true; result: EtaResult }
  | { ok: false; error: string }
> {
  const key = getApiKey();
  if (!key) {
    return { ok: false, error: "GOOGLE_MAPS_API_KEY is not configured." };
  }

  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: { latitude: origin.lat, longitude: origin.lng },
          },
        },
        destination: {
          location: {
            latLng: { latitude: destination.lat, longitude: destination.lng },
          },
        },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
      }),
    }
  );

  let data: ComputeRoutesResponse;
  try {
    data = (await response.json()) as ComputeRoutesResponse;
  } catch {
    return {
      ok: false,
      error: `Routes API request failed (HTTP ${response.status}).`,
    };
  }

  const apiError = data.error?.message;
  if (!response.ok || apiError) {
    return {
      ok: false,
      error:
        apiError ??
        `Routes API request failed (HTTP ${response.status}). Enable Routes API for this key.`,
    };
  }

  const route = data.routes?.[0];
  const durationSeconds = parseDurationSeconds(route?.duration);
  if (durationSeconds == null) {
    return { ok: false, error: "No route found for these coordinates." };
  }

  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

  return {
    ok: true,
    result: {
      durationMinutes,
      durationSeconds,
      distanceMeters: route?.distanceMeters ?? 0,
    },
  };
}

/** Best-effort ETA minutes; returns null when coords or API are unavailable. */
export async function resolveDrivingEtaMinutes(
  origin: LatLng | null | undefined,
  destination: LatLng | null | undefined
): Promise<number | null> {
  if (!isValidPoint(origin) || !isValidPoint(destination)) return null;

  return perfAsync("eta calculation", async () => {
    const result = await getDrivingEta(origin, destination);
    if (!result.ok) {
      logWarn("eta", result.error, { context: { origin, destination } });
      return null;
    }
    return result.result.durationMinutes;
  });
}
