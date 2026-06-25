/** Earth radius in meters */
const R = 6371000;

/** ~400 ft — close enough for residential pickup/drop-off */
export const ARRIVAL_RADIUS_METERS = 120;

/** Haversine distance between two coordinates in meters */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinArrivalRadius(
  driverLat: number,
  driverLng: number,
  destLat: number,
  destLng: number,
  radiusMeters = ARRIVAL_RADIUS_METERS
): boolean {
  return (
    distanceMeters(driverLat, driverLng, destLat, destLng) <= radiusMeters
  );
}

export function formatDistanceMeters(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** 0 at departure, 1 when within arrival radius. */
export function travelProgressToArrival(
  distanceMeters: number,
  initialDistanceMeters: number,
  arrivalRadiusMeters = ARRIVAL_RADIUS_METERS
): number {
  const travelSpan = Math.max(initialDistanceMeters - arrivalRadiusMeters, 1);
  const remaining = Math.max(distanceMeters - arrivalRadiusMeters, 0);
  return Math.min(1, Math.max(0, 1 - remaining / travelSpan));
}
