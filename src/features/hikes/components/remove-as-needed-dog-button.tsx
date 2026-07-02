"use client";

import { removeAsNeededDogFromDayAction } from "@/features/hikes/actions";

export function RemoveAsNeededDogButton({
  routeId,
  date,
  dogId,
  dogName,
}: {
  routeId: string;
  date: string;
  dogId: string;
  dogName: string;
}) {
  async function remove() {
    if (
      !confirm(
        `Remove ${dogName} from this day's route plan? Their long-term schedule will not change.`
      )
    ) {
      return;
    }
    await removeAsNeededDogFromDayAction(routeId, date, dogId);
  }

  return (
    <button
      type="button"
      onClick={remove}
      className="text-xs text-stone-500 hover:text-red-700"
    >
      Remove from this day
    </button>
  );
}
