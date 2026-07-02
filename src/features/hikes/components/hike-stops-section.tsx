import { HikeStopsReorder } from "@/features/hikes/components/hike-stops-reorder";
import { RemoveAsNeededDogButton } from "@/features/hikes/components/remove-as-needed-dog-button";
import { StopWindowEditor } from "@/features/hikes/components/stop-window-editor";
import { formatWindowRange } from "@/lib/dates";
import { Badge } from "@/features/admin/components/ui";
import type { DogScheduleType, StopType } from "@/types";
import type { HikePeriod } from "@/features/hikes/hike-period";

type StopRow = {
  id: string;
  dog_id: string;
  stop_type: StopType;
  status: string;
  window_start: string | null;
  window_end: string | null;
  sort_order: number;
  dogs: {
    name: string;
    schedule_type?: DogScheduleType;
    customers: { owner_name: string } | null;
  } | null;
};

function stopSublabel(stop: StopRow): string {
  const parts = [stop.dogs?.customers?.owner_name ?? ""];
  const window = formatWindowRange(stop.window_start, stop.window_end);
  if (window) parts.push(window);
  parts.push(stop.status.replaceAll("_", " "));
  return parts.filter(Boolean).join(" · ");
}

export function HikeStopsSection({
  hikeId,
  routeId,
  date,
  period,
  stopType,
  title,
  stops,
}: {
  hikeId: string;
  routeId?: string;
  date?: string;
  period?: HikePeriod;
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
    sublabel: stopSublabel(s),
  }));

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-medium text-stone-900">{title}</h2>
        {stopType === "pickup" ? (
          <p className="mt-1 text-sm text-stone-500">
            Planned order for the day — drivers can still work in whatever order
            makes sense on the road.
          </p>
        ) : (
          <p className="mt-1 text-sm text-stone-500">
            Reverse of the pickup order. Drop-off windows are optional — leave
            blank when afternoon timing is flexible.
          </p>
        )}
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

      <ul className="mt-4 space-y-3">
        {filtered.map((stop) => (
          <li
            key={stop.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium text-stone-900">
                {stop.dogs?.name ?? "Unknown"}
                {stop.dogs?.schedule_type === "as_needed" ? (
                  <span className="ml-2 text-xs font-normal text-stone-500">
                    As-needed
                  </span>
                ) : null}
              </p>
              <StopWindowEditor
                stopId={stop.id}
                windowStart={stop.window_start}
                windowEnd={stop.window_end}
                optional={stopType === "dropoff"}
                label={
                  stopType === "dropoff" ? "Planned drop-off window" : "Planned window"
                }
              />
            </div>
            {stopType === "pickup" &&
            routeId &&
            date &&
            period &&
            stop.dogs?.schedule_type === "as_needed" &&
            stop.status === "scheduled" ? (
              <RemoveAsNeededDogButton
                routeId={routeId}
                date={date}
                period={period}
                dogId={stop.dog_id}
                dogName={stop.dogs.name}
              />
            ) : null}
          </li>
        ))}
      </ul>

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
