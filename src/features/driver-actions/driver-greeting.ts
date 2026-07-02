import { formatTime } from "@/lib/dates";
import type { DriverDayView, DriverStopView } from "@/features/driver-actions/queries";

export function driverFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

export function driverGreeting(fullName: string, timeZone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hour12: false,
    }).format(new Date())
  );
  const salutation =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${salutation}, ${driverFirstName(fullName)}.`;
}

export function countPickupStops(day: DriverDayView) {
  return day.routes.reduce((n, r) => n + r.pickups.length, 0);
}

export function countCompletedPickups(day: DriverDayView) {
  return day.routes.reduce(
    (n, r) => n + r.pickups.filter((s) => s.status === "picked_up").length,
    0
  );
}

export function countDropoffStops(day: DriverDayView) {
  return day.routes.reduce((n, r) => n + r.dropoffs.length, 0);
}

export function countCompletedDropoffs(day: DriverDayView) {
  return day.routes.reduce(
    (n, r) => n + r.dropoffs.filter((s) => s.status === "dropped_off").length,
    0
  );
}

/** Latest pickup window end — rough estimate for finishing the pickup loop. */
export function estimatePickupCompletionTime(
  pickups: DriverStopView[]
): string | null {
  if (pickups.length === 0) return null;

  const open = pickups.filter((s) => s.status !== "picked_up");
  const pool = open.length > 0 ? open : pickups;

  let latest = pool[0].windowEnd;
  if (!latest) return null;
  for (const stop of pool) {
    if (stop.windowEnd && stop.windowEnd > latest) latest = stop.windowEnd;
  }

  return formatTime(latest);
}

export function routeSummaryLabel(day: DriverDayView): string {
  if (day.routes.length === 1) return day.routes[0].routeName;
  return `${day.routes.length} routes`;
}

export function dayProgressMessage(day: DriverDayView): string | null {
  const totalPickups = countPickupStops(day);
  const donePickups = countCompletedPickups(day);
  const totalDropoffs = countDropoffStops(day);
  const doneDropoffs = countCompletedDropoffs(day);

  if (totalPickups === 0 && totalDropoffs === 0) return null;

  if (totalPickups > 0 && donePickups < totalPickups) {
    return `${donePickups} of ${totalPickups} pickups complete`;
  }

  if (totalPickups > 0 && donePickups === totalPickups && totalDropoffs > 0) {
    if (doneDropoffs < totalDropoffs) {
      if (donePickups === totalPickups && doneDropoffs === 0) {
        return "Morning pickups complete";
      }
      return `${doneDropoffs} of ${totalDropoffs} dogs home`;
    }
    return "All dogs home";
  }

  if (totalPickups > 0 && donePickups === totalPickups) {
    return "Morning pickups complete";
  }

  return null;
}

export function allPickupsComplete(day: DriverDayView): boolean {
  const total = countPickupStops(day);
  return total > 0 && countCompletedPickups(day) === total;
}

export function allDropoffsComplete(day: DriverDayView): boolean {
  const total = countDropoffStops(day);
  return total > 0 && countCompletedDropoffs(day) === total;
}

export function allStopsComplete(day: DriverDayView): boolean {
  const pickups = countPickupStops(day);
  const dropoffs = countDropoffStops(day);
  if (pickups === 0 && dropoffs === 0) return false;
  return (
    countCompletedPickups(day) === pickups &&
    countCompletedDropoffs(day) === dropoffs
  );
}
