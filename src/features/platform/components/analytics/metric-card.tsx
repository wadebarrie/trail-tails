import { formatUsd } from "@/features/platform/analytics/cost";

export function MetricCard({
  label,
  value,
  subtext,
  tone = "default",
}: {
  label: string;
  value: string | number;
  subtext?: string;
  tone?: "default" | "positive" | "negative" | "warning";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "negative"
        ? "text-red-700"
        : tone === "warning"
          ? "text-amber-700"
          : "text-stone-900";

  return (
    <div className="surface-elevated rounded-[var(--radius-card)] p-4 motion-interactive hover:shadow-[var(--elevation-3)]">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {subtext ? <p className="mt-1 text-xs text-stone-500">{subtext}</p> : null}
    </div>
  );
}

export function MetricCardUsd({
  label,
  amount,
  subtext,
  tone = "default",
}: {
  label: string;
  amount: number;
  subtext?: string;
  tone?: "default" | "positive" | "negative" | "warning";
}) {
  return (
    <MetricCard
      label={label}
      value={formatUsd(amount)}
      subtext={subtext}
      tone={tone}
    />
  );
}
