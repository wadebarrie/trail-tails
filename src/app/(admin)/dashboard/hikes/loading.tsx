export default function AdminHikesLoading() {
  return (
    <div className="motion-skeleton">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="h-8 w-32 rounded bg-stone-200" />
          <div className="mt-2 h-4 w-48 rounded bg-stone-100" />
        </div>
        <div className="h-11 w-36 rounded-lg bg-stone-200" />
      </div>

      <div className="space-y-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-stone-200 bg-stone-50/50 p-6"
          >
            <div className="h-6 w-40 rounded bg-stone-200" />
            <div className="mt-4 h-10 w-full max-w-xs rounded bg-stone-100" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-12 rounded-lg bg-stone-100" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
