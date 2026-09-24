"use client";

import { SortableList } from "@/features/admin/components/sortable-list";
import { reorderDriverDropoffsAction } from "@/features/driver-actions/actions";
import { formatWindowRange } from "@/lib/dates";
import type { DriverStopView } from "@/features/driver-actions/queries";

function isIncomplete(status: string) {
  return status === "scheduled" || status === "en_route" || status === "arrived";
}

type DriverDropoffReorderProps = {
  hikeId: string;
  dropoffs: DriverStopView[];
};

export function DriverDropoffReorder({
  hikeId,
  dropoffs,
}: DriverDropoffReorderProps) {
  const incomplete = [...dropoffs]
    .filter((s) => isIncomplete(s.status))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const canReorder = hikeId.length > 0 && incomplete.length >= 2;
  if (!canReorder) return null;

  const started = dropoffs.some((s) => s.status !== "scheduled");

  const items = incomplete.map((s) => ({
    id: s.id,
    label: s.dogName,
    sublabel: [s.ownerName, formatWindowRange(s.windowStart, s.windowEnd)]
      .filter(Boolean)
      .join(" · "),
  }));

  async function onReorder(orderedIds: string[]) {
    return reorderDriverDropoffsAction(hikeId, orderedIds);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 className="text-sm font-medium text-white/80">Drop-off order</h2>
      <p className="mt-1 text-xs text-white/45">
        {started
          ? "Drag to reorder remaining drop-offs. Finished stops stay put."
          : "Drag to set a custom drop-off order (defaults to reverse of pickups)."}
      </p>
      <div className="mt-4">
        <SortableList variant="dark" items={items} onReorder={onReorder} />
      </div>
    </section>
  );
}
