import { distanceMeters } from "@/lib/geo";

export type GeoPoint = {
  id: string;
  lat: number;
  lng: number;
};

/** Nearest-neighbor ordering — good enough for ~10–20 dog routes without a routing API. */
export function autoSortByProximity(points: GeoPoint[]): string[] {
  if (points.length <= 1) return points.map((p) => p.id);

  const remaining = new Map(points.map((p) => [p.id, p]));
  const ordered: string[] = [];

  let current = pickStartPoint([...remaining.values()]);
  remaining.delete(current.id);
  ordered.push(current.id);

  while (remaining.size > 0) {
    let nearest: GeoPoint | null = null;
    let nearestDist = Infinity;

    for (const point of remaining.values()) {
      const dist = distanceMeters(
        current.lat,
        current.lng,
        point.lat,
        point.lng
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = point;
      }
    }

    if (!nearest) break;
    remaining.delete(nearest.id);
    ordered.push(nearest.id);
    current = nearest;
  }

  return ordered;
}

function pickStartPoint(points: GeoPoint[]): GeoPoint {
  return points.reduce((best, p) => (p.lat >= best.lat ? p : best));
}

export type DogGeoInput = {
  id: string;
  lat: number | null;
  lng: number | null;
  route_sort_order: number;
};

/** Dogs with GPS first (optimized), then dogs missing coords in current order. */
export function autoSortDogIds(dogs: DogGeoInput[]): string[] {
  const withCoords = dogs.filter((d) => d.lat != null && d.lng != null);
  const withoutCoords = dogs
    .filter((d) => d.lat == null || d.lng == null)
    .sort((a, b) => a.route_sort_order - b.route_sort_order);

  const sortedWithCoords =
    withCoords.length > 0
      ? autoSortByProximity(
          withCoords.map((d) => ({
            id: d.id,
            lat: d.lat!,
            lng: d.lng!,
          }))
        )
      : [];

  return [...sortedWithCoords, ...withoutCoords.map((d) => d.id)];
}
