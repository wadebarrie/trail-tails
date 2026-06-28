"use client";

import { SortableList } from "@/features/admin/components/sortable-list";
import { reorderDriverPickupsAction } from "@/features/driver-actions/actions";
import { formatTime } from "@/lib/dates";
import type { DriverStopView } from "@/features/driver-actions/queries";

type DriverPickupReorderProps = {
  hikeId: string;
  pickups: DriverStopView[];
};

export function DriverPickupReorder({ hikeId, pickups }: DriverPickupReorderProps) {
  const canReorder =
    hikeId.length > 0 &&
    pickups.length >= 2 &&
    pickups.every((s) => s.status === "scheduled");

  if (!canReorder) return null;

  const items = [...pickups]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => ({
      id: s.id,
      label: s.dogName,
      sublabel: s.ownerName
        ? `${s.ownerName} · ${formatTime(s.windowStart)}–${formatTime(s.windowEnd)}`
        : `${formatTime(s.windowStart)}–${formatTime(s.windowEnd)}`,
    }));

  async function onReorder(orderedIds: string[]) {
    return reorderDriverPickupsAction(hikeId, orderedIds);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 className="text-sm font-medium text-white/80">Pickup order</h2>
      <p className="mt-1 text-xs text-white/45">
        Drag to reorder before you start the route. Drop-offs follow the reverse order.
      </p>
      <div className="mt-4">
        <SortableList variant="dark" items={items} onReorder={onReorder} />
      </div>
    </section>
  );
}
