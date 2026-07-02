"use client";

import { useEffect, useState } from "react";
import type { DriverBriefingNote } from "@/features/driver-actions/briefing-notes";
import { DriverDailyBriefing } from "@/features/driver-actions/components/driver-daily-briefing";
import { DriverDayView } from "@/features/driver-actions/components/driver-day-view";
import {
  DriverFeedbackProvider,
  useDriverFeedback,
} from "@/features/driver-actions/components/driver-feedback";
import {
  DriverDayStateProvider,
  useDriverDayState,
} from "@/features/driver-actions/driver-day-state";
import {
  allStopsComplete,
  countCompletedDropoffs,
  countCompletedPickups,
  countDropoffStops,
  countPickupStops,
  driverGreeting,
  estimatePickupCompletionTime,
  isRouteDayInProgress,
  routeSummaryLabel,
} from "@/features/driver-actions/driver-greeting";
import {
  dismissBriefingForDate,
  isBriefingDismissed,
} from "@/features/driver-actions/use-briefing-dismissed";
import type { DriverDayView as DriverDayViewData } from "@/features/driver-actions/queries";

type DriverDayShellProps = {
  active: "today" | "tomorrow";
  day: DriverDayViewData;
  preview?: boolean;
  driverName: string;
  timeZone: string;
  briefingNotes: DriverBriefingNote[];
};

function milestoneKey(date: string, kind: string) {
  return `packroute-milestone:${date}:${kind}`;
}

function milestoneSeen(date: string, kind: string) {
  return sessionStorage.getItem(milestoneKey(date, kind)) === "1";
}

function markMilestone(date: string, kind: string) {
  sessionStorage.setItem(milestoneKey(date, kind), "1");
}

function DriverDayContent({
  active,
  day,
  preview = false,
}: {
  active: "today" | "tomorrow";
  day: DriverDayViewData;
  preview?: boolean;
}) {
  const { showFeedback } = useDriverFeedback();
  const { mergeDay } = useDriverDayState();
  const mergedDay = mergeDay(day);

  const totalPickups = countPickupStops(mergedDay);
  const totalDropoffs = countDropoffStops(mergedDay);
  const donePickups = countCompletedPickups(mergedDay);
  const doneDropoffs = countCompletedDropoffs(mergedDay);

  useEffect(() => {
    if (preview || active !== "today") return;

    if (allStopsComplete(mergedDay) && !milestoneSeen(day.date, "done")) {
      markMilestone(day.date, "done");
      showFeedback("Great work today.");
      return;
    }

    if (
      totalDropoffs > 0 &&
      doneDropoffs === totalDropoffs &&
      !milestoneSeen(day.date, "dropoffs")
    ) {
      markMilestone(day.date, "dropoffs");
      showFeedback("All dogs home.");
      return;
    }

    if (
      totalPickups > 0 &&
      donePickups === totalPickups &&
      !milestoneSeen(day.date, "pickups")
    ) {
      markMilestone(day.date, "pickups");
      showFeedback("Morning pickups complete. Enjoy the hike.");
    }
  }, [
    active,
    preview,
    day.date,
    mergedDay,
    totalPickups,
    totalDropoffs,
    donePickups,
    doneDropoffs,
    showFeedback,
  ]);

  return <DriverDayView active={active} day={mergedDay} preview={preview} />;
}

function DriverDayShellInner({
  active,
  day,
  preview = false,
  driverName,
  timeZone,
  briefingNotes,
}: DriverDayShellProps) {
  const [briefingOpen, setBriefingOpen] = useState(false);

  const totalPickups = countPickupStops(day);
  const allPickups = day.routes.flatMap((r) => r.pickups);
  const estimatedCompletion = estimatePickupCompletionTime(allPickups);

  useEffect(() => {
    if (preview || active !== "today" || totalPickups === 0) {
      setBriefingOpen(false);
      return;
    }
    if (isRouteDayInProgress(day)) {
      dismissBriefingForDate(day.date);
      setBriefingOpen(false);
      return;
    }
    setBriefingOpen(!isBriefingDismissed(day.date));
  }, [active, day, day.date, preview, totalPickups]);

  function handleStartRoute() {
    dismissBriefingForDate(day.date);
    setBriefingOpen(false);
  }

  if (briefingOpen) {
    return (
      <DriverDailyBriefing
        greeting={driverGreeting(driverName, timeZone)}
        routeLabel={routeSummaryLabel(day)}
        dogCount={totalPickups}
        estimatedPickupCompletion={estimatedCompletion}
        notes={briefingNotes}
        onStart={handleStartRoute}
      />
    );
  }

  return (
    <DriverDayStateProvider>
      <DriverDayContent active={active} day={day} preview={preview} />
    </DriverDayStateProvider>
  );
}

export function DriverDayShell(props: DriverDayShellProps) {
  return (
    <DriverFeedbackProvider>
      <DriverDayShellInner {...props} />
    </DriverFeedbackProvider>
  );
}
