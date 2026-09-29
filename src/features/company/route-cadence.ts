import type { HikePeriod } from "@/features/hikes/hike-period";

/** How many PackRoute periods a company typically runs each day. */
export type RouteCadence = "once" | "twice";

export const ROUTE_CADENCES: RouteCadence[] = ["once", "twice"];

export function isRouteCadence(value: unknown): value is RouteCadence {
  return value === "once" || value === "twice";
}

export function parseRouteCadence(
  value: unknown,
  fallback: RouteCadence = "twice"
): RouteCadence {
  return isRouteCadence(value) ? value : fallback;
}

/** Period label for lists — empty when the company only runs one period/day. */
export function cadencePeriodLabel(
  period: HikePeriod,
  cadence: RouteCadence
): string | null {
  if (cadence === "once") return null;
  return period === "morning" ? "Morning" : "Afternoon";
}

/** “morning walk” / “afternoon walk”, or neutral “walk” for once-a-day companies. */
export function cadenceWalkLabel(
  period: HikePeriod,
  cadence: RouteCadence
): string {
  if (cadence === "once") return "walk";
  return period === "morning" ? "morning walk" : "afternoon walk";
}

export function cadenceRouteTitleSuffix(
  period: HikePeriod,
  cadence: RouteCadence
): string {
  if (cadence === "once") return "";
  return ` — ${cadenceWalkLabel(period, cadence)}`;
}
