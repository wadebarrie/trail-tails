import { HikeStopsReorder } from "@/features/hikes/components/hike-stops-reorder";
import { RemoveAsNeededDogButton } from "@/features/hikes/components/remove-as-needed-dog-button";
import { StopWindowEditor } from "@/features/hikes/components/stop-window-editor";
import { formatWindowRange } from "@/lib/dates";
import type { DogScheduleType, StopType } from "@/types";

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
  stopType,
  title,
  stops,
}: {
  hikeId: string;
  routeId?: string;
  date?: string;
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
        <p className="text-sm text-stone-500">
          {stopType === "pickup"
            ? "No dogs on this list yet."
            : "No drop-offs on this list yet."}
        </p>
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
            Drag to set the planned order. Drivers can still adjust on the road.
            Edit pickup times below each dog.
          </p>
        ) : (
          <p className="mt-1 text-sm text-stone-500">
            Reverse of the pickup order. Drop-off times are optional — leave blank
            when afternoon timing is flexible.
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
                    Today only
                  </span>
                ) : null}
              </p>
              <StopWindowEditor
                stopId={stop.id}
                windowStart={stop.window_start}
                windowEnd={stop.window_end}
                optional={stopType === "dropoff"}
                allowSaveAsDogDefault={stopType === "pickup"}
                label={
                  stopType === "dropoff"
                    ? "Drop-off time today"
                    : "Pickup time today"
                }
              />
            </div>
            {stopType === "pickup" &&
            routeId &&
            date &&
            stop.dogs?.schedule_type === "as_needed" &&
            stop.status === "scheduled" ? (
              <RemoveAsNeededDogButton
                routeId={routeId}
                date={date}
                dogId={stop.dog_id}
                dogName={stop.dogs.name}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
