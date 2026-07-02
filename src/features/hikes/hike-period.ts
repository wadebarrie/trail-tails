export type HikePeriod = "morning" | "afternoon";

export const HIKE_PERIODS: HikePeriod[] = ["morning", "afternoon"];

export function hikePeriodLabel(period: HikePeriod): string {
  return period === "morning" ? "Morning" : "Afternoon";
}

export function hikePeriodWalkLabel(period: HikePeriod): string {
  return period === "morning" ? "morning walk" : "afternoon walk";
}
