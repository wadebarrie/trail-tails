export default function DriverLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex gap-2">
        <div className="h-10 w-20 rounded-full bg-white/10" />
        <div className="h-10 w-24 rounded-full bg-white/10" />
      </div>

      <div className="h-8 w-28 rounded bg-white/15" />
      <div className="mt-2 h-4 w-40 rounded bg-white/10" />

      <div className="mt-6 flex gap-3">
        <div className="h-8 w-32 rounded-full bg-white/10" />
        <div className="h-8 w-40 rounded-full bg-white/10" />
      </div>

      <div className="mt-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="h-5 w-36 rounded bg-white/10" />
            <div className="mt-3 h-4 w-full max-w-sm rounded bg-white/10" />
            <div className="mt-4 h-11 w-full rounded-lg bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
