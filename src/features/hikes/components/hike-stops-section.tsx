"use client";

import { HikeStopsReorder } from "@/features/hikes/components/hike-stops-reorder";
import { AutoRouteButton } from "@/features/routes/components/auto-route-button";
import { autoSortHikePickupsAction } from "@/features/hikes/actions";
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

  const canAutoRoute =
    stopType === "pickup" &&
    filtered.every((s) => s.status === "scheduled");

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-stone-900">{title}</h2>
          {stopType === "dropoff" ? (
            <p className="mt-1 text-sm text-stone-500">
              Reverse of the pickup order — updates automatically when you reorder
              pickups.
            </p>
          ) : null}
        </div>
        {canAutoRoute ? (
          <AutoRouteButton
            onAutoRoute={autoSortHikePickupsAction.bind(null, hikeId)}
          />
        ) : null}
      </div>

      {stopType === "pickup" ? (
        <HikeStopsReorder hikeId={hikeId} stopType="pickup" items={sortableItems} />
      ) : (
        <ol className="space-y-2">
          {sortableItems.map((item, index) => (
            <li
              key={item.id}
              className="rounded-lg border border-stone-200 bg-white px-4 py-3"
            >
              <p className="font-medium text-stone-900">
                {index + 1}. {item.label}
              </p>
              {item.sublabel ? (
                <p className="mt-0.5 text-sm text-stone-500">{item.sublabel}</p>
              ) : null}
            </li>
          ))}
        </ol>
      )}

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
