export type HikePeriod = "morning" | "afternoon";
export type DogWalkPeriod = "morning" | "afternoon" | "both";

export const HIKE_PERIODS: HikePeriod[] = ["morning", "afternoon"];

export function hikePeriodLabel(period: HikePeriod): string {
  return period === "morning" ? "Morning" : "Afternoon";
}

export function hikePeriodWalkLabel(period: HikePeriod): string {
  return period === "morning" ? "morning walk" : "afternoon walk";
}

export function dogMatchesPeriod(
  walkPeriod: DogWalkPeriod | string,
  period: HikePeriod
): boolean {
  if (walkPeriod === "both") return true;
  return walkPeriod === period;
}

export function periodsForRoute(runsAfternoon: boolean): HikePeriod[] {
  return runsAfternoon ? ["morning", "afternoon"] : ["morning"];
}
