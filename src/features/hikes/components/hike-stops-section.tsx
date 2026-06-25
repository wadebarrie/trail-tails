import { SortableList } from "@/features/admin/components/sortable-list";
import { reorderStopsAction } from "@/features/hikes/actions";
import { formatTime } from "@/lib/dates";
import { Badge } from "@/features/admin/components/ui";
import type { StopType } from "@/types";

type StopRow = {
  id: string;
  dog_id: string;
  stop_type: StopType;
  status: string;
  window_start: string;
  window_end: string;
  sort_order: number;
  dogs: { name: string; customers: { owner_name: string } | null } | null;
};

export function HikeStopsSection({
  hikeId,
  stopType,
  title,
  stops,
}: {
  hikeId: string;
  stopType: StopType;
  title: string;
  stops: StopRow[];
}) {
  const filtered = stops
    .filter((s) => s.stop_type === stopType)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (filtered.length === 0) {
    return (
      <section>
        <h2 className="mb-3 text-lg font-medium text-stone-900">{title}</h2>
        <p className="text-sm text-stone-500">No stops scheduled.</p>
      </section>
    );
  }

  const sortableItems = filtered.map((s) => ({
    id: s.id,
    label: s.dogs?.name ?? "Unknown",
    sublabel: `${s.dogs?.customers?.owner_name ?? ""} · ${formatTime(s.window_start)}–${formatTime(s.window_end)} · ${s.status.replaceAll("_", " ")}`,
  }));

  return (
    <section>
      <h2 className="mb-3 text-lg font-medium text-stone-900">{title}</h2>
      <SortableList
        items={sortableItems}
        onReorder={(ids) => reorderStopsAction(hikeId, stopType, ids)}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {filtered.map((s) => (
          <Badge
            key={s.id}
            tone={
              s.status === "scheduled"
                ? "neutral"
                : s.status === "picked_up" || s.status === "dropped_off"
                  ? "green"
                  : "amber"
            }
          >
            {s.dogs?.name}: {s.status.replaceAll("_", " ")}
          </Badge>
        ))}
      </div>
    </section>
  );
}
