export default function AdminDashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-48 rounded bg-stone-200" />
        <div className="mt-2 h-4 w-72 max-w-full rounded bg-stone-100" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="surface-elevated rounded-[var(--radius-card)] p-5"
          >
            <div className="h-4 w-24 rounded bg-stone-100" />
            <div className="mt-3 h-8 w-20 rounded bg-stone-200" />
            <div className="mt-2 h-4 w-32 rounded bg-stone-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
