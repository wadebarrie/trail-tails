import type { TrendPoint } from "@/features/platform/analytics/types";

export function TrendChart({
  title,
  points,
  valueFormat = "number",
}: {
  title: string;
  points: TrendPoint[];
  valueFormat?: "number" | "percent";
}) {
  const max = Math.max(...points.map((p) => p.value), 1);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      <div className="mt-4 flex h-32 items-end gap-1">
        {points.map((point) => {
          const height = Math.max(4, (point.value / max) * 100);
          const label =
            valueFormat === "percent"
              ? `${(point.value * 100).toFixed(0)}%`
              : String(point.value);

          return (
            <div
              key={point.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
            >
              <div
                className="w-full rounded-t bg-[var(--color-trail-600)]/80 transition-colors group-hover:bg-[var(--color-trail-700)]"
                style={{ height: `${height}%` }}
                title={`${point.date}: ${label}`}
              />
              <span className="mt-1 hidden text-[10px] text-stone-400 sm:block">
                {point.date.slice(5)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
