import { logWarn } from "@/lib/logger";

export type GeocodeResult = {
  lat: number;
  lng: number;
  formattedAddress?: string;
};

type GeocodeV4Response = {
  results?: {
    formattedAddress?: string;
    location?: { latitude: number; longitude: number };
  }[];
  error?: { message?: string; status?: string; code?: number };
};

export function isGeocodingConfigured(): boolean {
  return Boolean(process.env.GOOGLE_MAPS_API_KEY?.trim());
}

function getApiKey(): string | null {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  return key || null;
}

/**
 * Geocode a street address via Geocoding API v4.
 * @see https://developers.google.com/maps/documentation/geocoding/geocoding
 */
export async function geocodeAddress(
  address: string
): Promise<
  | { ok: true; result: GeocodeResult }
  | { ok: false; error: string }
> {
  const key = getApiKey();
  if (!key) {
    return { ok: false, error: "GOOGLE_MAPS_API_KEY is not configured." };
  }

  const trimmed = address.trim();
  const url = `https://geocode.googleapis.com/v4/geocode/address/${encodeURIComponent(trimmed)}`;

  const response = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": key,
    },
  });

  let data: GeocodeV4Response;
  try {
    data = (await response.json()) as GeocodeV4Response;
  } catch {
    return {
      ok: false,
      error: `Geocoding request failed (HTTP ${response.status}).`,
    };
  }

  const apiError = data.error?.message;
  if (!response.ok || apiError) {
    const error =
      apiError ??
      `Geocoding request failed (HTTP ${response.status}). Check that Geocoding API is enabled and your key restrictions allow it.`;
    logWarn("geocode", error, { context: { addressPreview: trimmed.slice(0, 80) } });
    return { ok: false, error };
  }

  const result = data.results?.[0];
  if (!result?.location) {
    const error = "Could not find that address. Check the spelling and try again.";
    logWarn("geocode", error, { context: { addressPreview: trimmed.slice(0, 80) } });
    return { ok: false, error };
  }

  return {
    ok: true,
    result: {
      lat: result.location.latitude,
      lng: result.location.longitude,
      formattedAddress: result.formattedAddress,
    },
  };
}

/** Geocode when configured; preserve existing coords if address unchanged. */
export async function resolveCustomerCoordinates(
  address: string,
  existing?: {
    address: string;
    address_lat: number | null;
    address_lng: number | null;
  } | null
): Promise<
  | { ok: true; lat: number | null; lng: number | null }
  | { ok: false; error: string }
> {
  if (
    existing &&
    existing.address.trim() === address.trim() &&
    existing.address_lat != null &&
    existing.address_lng != null
  ) {
    return {
      ok: true,
      lat: existing.address_lat,
      lng: existing.address_lng,
    };
  }

  if (!isGeocodingConfigured()) {
    return { ok: true, lat: null, lng: null };
  }

  const geocoded = await geocodeAddress(address);
  if (!geocoded.ok) {
    return { ok: false, error: geocoded.error };
  }

  return {
    ok: true,
    lat: geocoded.result.lat,
    lng: geocoded.result.lng,
  };
}
