function MockWindow({ children }: { children: React.ReactNode }) {
  return (
    <div className="surface-elevated overflow-hidden rounded-[var(--radius-card)] shadow-[var(--elevation-3)]">
      <div className="flex items-center gap-2 border-b border-[var(--glass-border-subtle)] bg-[var(--color-surface-subtle)]/80 px-4 py-3 backdrop-blur-sm">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
        <span className="ml-2 text-xs text-stone-400">packroute.app/dashboard</span>
      </div>
      {children}
    </div>
  );
}

export function HeroDashboardMock() {
  const routes = [
    {
      name: "Vancouver",
      driver: "Alex C.",
      dogs: 8,
      progress: 62,
      pending: 0,
    },
    {
      name: "Burnaby / NW",
      driver: "Sam P.",
      dogs: 6,
      progress: 38,
      pending: 1,
    },
    {
      name: "Surrey / Delta",
      driver: "Jordan L.",
      dogs: 7,
      progress: 12,
      pending: 0,
    },
  ];

  return (
    <MockWindow>
      <div
        className="bg-[var(--color-trail-50)] p-4 sm:p-5"
        role="img"
        aria-label="Preview of the PackRoute office dashboard showing today's routes and drivers"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-trail-600)]">
              Today
            </p>
            <p className="text-lg font-semibold text-[var(--color-trail-800)]">
              Thursday routes
            </p>
          </div>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
            1 pending request
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {routes.map((route) => (
            <div
              key={route.name}
              className="surface-card rounded-[var(--radius-surface)] p-3 motion-interactive hover:shadow-[var(--elevation-2)]"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-stone-900">{route.name}</p>
                {route.pending ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                    Request
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-stone-500">{route.driver}</p>
              <p className="mt-2 text-xs text-stone-600">{route.dogs} dogs</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-[var(--color-trail-600)]"
                  style={{ width: `${route.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockWindow>
  );
}

export function SmsPhoneMock() {
  // Keep in sync with notifications/log.ts and sms/parser.ts REQUEST_ACK_REPLY.
  const messages = [
    {
      outbound: true,
      text: "Hi Sam! Cooper and Daisy are booked for a hike tomorrow and will be picked up between 8:05 AM and 8:35 AM. Alex will be your driver.",
    },
    {
      outbound: true,
      text: "Hi Sam! We're on the way to pick up Cooper. ETA is approximately 12 minutes.",
    },
    {
      outbound: true,
      text: "Cooper has been picked up. See you this afternoon!",
    },
    {
      outbound: true,
      text: "Cooper has been dropped off. Have a great day!",
    },
    { outbound: false, text: "Skip Friday" },
    {
      outbound: true,
      text: "Got it! We'll review your request shortly.",
    },
  ];

  return (
    <div
      className="mx-auto w-full max-w-xs"
      role="img"
      aria-label="Preview of customer SMS: night-before reminder, ETA, pickup and drop-off confirmations, and a schedule change reply"
    >
      <div className="overflow-hidden rounded-[2rem] border-4 border-stone-800 bg-stone-900 p-2 shadow-2xl">
        <div className="rounded-[1.5rem] bg-stone-100 px-3 pb-4 pt-8">
          <div className="mb-4 text-center">
            <p className="text-sm font-semibold text-stone-800">PackRoute</p>
          </div>
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.outbound ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    msg.outbound
                      ? "rounded-bl-md bg-white text-stone-800 shadow-sm"
                      : "rounded-br-md bg-[var(--color-trail-600)] text-white"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MockDriverProgressSteps({
  completedSteps,
  activeStep,
  stopType = "pickup",
}: {
  completedSteps: number;
  activeStep: number | null;
  stopType?: "pickup" | "dropoff";
}) {
  const completeLabel = stopType === "pickup" ? "Picked Up" : "Dropped Off";
  const steps = ["En Route", "Arrived", completeLabel];

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <ol className="flex items-start">
        {steps.map((label, index) => {
          const isComplete = index < completedSteps;
          const isCurrent = activeStep !== null && index === activeStep;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={label}
              className={`flex items-start ${isLast ? "shrink-0" : "min-w-0 flex-1"}`}
            >
              <div className="flex min-w-0 flex-col items-center">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                    isComplete
                      ? "bg-green-500/30 text-green-200"
                      : isCurrent
                        ? index === 1
                          ? "bg-sky-400 text-stone-900 ring-2 ring-sky-200/60"
                          : "bg-white text-[var(--color-trail-800)] ring-2 ring-white/60"
                        : "bg-white/10 text-white/35"
                  }`}
                >
                  {isComplete ? "✓" : index + 1}
                </div>
                <span
                  className={`mt-1 max-w-[3.25rem] text-center text-[9px] leading-tight font-medium ${
                    isComplete
                      ? "text-green-200/90"
                      : isCurrent
                        ? "text-white"
                        : "text-white/35"
                  }`}
                >
                  {label}
                </span>
              </div>
              {!isLast ? (
                index === 0 && activeStep === 1 && completedSteps === 1 ? (
                  <div className="relative mx-0.5 mt-2.5 min-w-2 flex-1">
                    <div className="relative h-1 overflow-hidden rounded-full bg-white/10">
                      <div className="absolute inset-y-0 left-0 w-[45%] rounded-full bg-gradient-to-r from-amber-400/90 to-sky-400/90" />
                    </div>
                  </div>
                ) : (
                  <div
                    className={`mx-0.5 mt-2.5 h-0.5 min-w-2 flex-1 rounded-full ${
                      index < completedSteps ? "bg-green-500/40" : "bg-white/10"
                    }`}
                  />
                )
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function MockDriverStopCard({
  dogName,
  ownerName,
  address,
  window,
  status,
}: {
  dogName: string;
  ownerName: string;
  address: string;
  window: string;
  status: "scheduled" | "en_route" | "done";
}) {
  const progress =
    status === "en_route"
      ? { completedSteps: 1, activeStep: 1 }
      : status === "done"
        ? { completedSteps: 3, activeStep: null }
        : { completedSteps: 0, activeStep: null };

  return (
    <div
      className={`rounded-2xl border p-3.5 ${
        status === "done"
          ? "border-green-500/30 bg-green-500/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-base font-semibold text-white">{dogName}</p>
            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-[10px] text-white/70">
              i
            </span>
          </div>
          <p className="mt-0.5 text-xs text-white/60">{ownerName}</p>
          <p className="mt-1 text-[11px] leading-snug text-white/50">{address}</p>
          <p className="mt-1 text-[10px] text-white/40">{window}</p>
        </div>
        {status === "done" ? (
          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-300">
            Done
          </span>
        ) : null}
      </div>

      <MockDriverProgressSteps {...progress} />

      {status === "scheduled" ? (
        <button
          type="button"
          className="mt-3 w-full rounded-2xl bg-amber-400 py-3.5 text-sm font-semibold text-stone-900"
        >
          En Route
        </button>
      ) : null}

      {status === "en_route" ? (
        <div className="mt-3 space-y-2">
          <div className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-3 py-2.5 text-center">
            <p className="text-[11px] font-medium text-sky-100">
              Auto-detecting arrival via GPS
            </p>
            <p className="mt-0.5 text-[10px] text-sky-200/70">850 m away · 45% of trip</p>
          </div>
          <p className="text-center text-[11px] font-medium text-white/70 underline-offset-2">
            Mark arrived manually
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function DriverMobileMock() {
  return (
    <div
      className="mx-auto w-full max-w-[280px]"
      role="img"
      aria-label="Preview of the PackRoute driver mobile view with today's pickup stops and en route status"
    >
      <div className="overflow-hidden rounded-[2rem] border-4 border-stone-800 bg-[var(--color-trail-800)] shadow-2xl">
        {/* App header */}
        <div className="flex items-start justify-between border-b border-white/10 px-3.5 pb-3 pt-4">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-widest text-white/60">
              PackRoute · Driver
            </p>
            <p className="mt-0.5 text-xs text-white/80">Sam Patel</p>
          </div>
          <p className="text-[10px] text-white/50">Help</p>
        </div>

        <div className="px-3.5 pb-5 pt-4">
          {/* Today / Tomorrow tabs */}
          <div className="mb-4 flex gap-1 rounded-xl bg-white/5 p-1">
            <div className="flex-1 rounded-lg bg-white py-2 text-center text-xs font-medium text-[var(--color-trail-800)] shadow-sm">
              Today
            </div>
            <div className="flex-1 rounded-lg py-2 text-center text-xs font-medium text-white/70">
              Tomorrow
            </div>
          </div>

          <h2 className="text-xl font-bold text-white">Today</h2>
          <p className="mt-0.5 text-xs text-white/70">Thursday, June 27</p>

          {/* Status */}
          <div className="mt-3">
            <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-white/80">
              2 pickups left
            </span>
          </div>

          {/* Route */}
          <p className="mb-2.5 mt-5 text-sm font-semibold text-white/90">
            New Westminster / Burnaby
          </p>

          <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-white/50">
            Morning pickups
          </p>

          <div className="space-y-2.5">
            <MockDriverStopCard
              dogName="Cooper"
              ownerName="Alex Chen"
              address="425 Sixth St, New Westminster"
              window="8:05 AM–8:35 AM"
              status="en_route"
            />
            <MockDriverStopCard
              dogName="Daisy"
              ownerName="Jordan Lee"
              address="218 E Columbia St, New Westminster"
              window="8:10 AM–8:40 AM"
              status="scheduled"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardMock() {
  return (
    <MockWindow>
      <div
        className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5"
        role="img"
        aria-label="Preview of the PackRoute admin dashboard with today's routes and billing summary"
      >
        <div className="surface-card rounded-[var(--radius-surface)] p-4 sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-stone-900">Today&apos;s operations</p>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              2 pending requests
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {["Vancouver", "Burnaby", "Surrey"].map((route, i) => (
              <div key={route} className="rounded-lg bg-stone-50 p-3">
                <p className="text-sm font-medium text-stone-800">{route}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {6 + i} stops · {["On route", "Pickup phase", "Complete"][i]}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card rounded-[var(--radius-surface)] p-4 sm:col-span-2">
          <p className="text-sm font-semibold text-stone-900">Billing period</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-trail-700)]">142</p>
          <p className="text-xs text-stone-500">Completed hikes · export CSV</p>
        </div>
      </div>
    </MockWindow>
  );
}
