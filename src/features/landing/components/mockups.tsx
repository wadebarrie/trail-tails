function MockWindow({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/10">
      <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
        <span className="ml-2 text-xs text-stone-400">packroute.netlify.app/dashboard</span>
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
      <div className="bg-[var(--color-trail-50)] p-4 sm:p-5">
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
              className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm"
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
              <p className="mt-2 text-xs text-stone-600">{route.dogs} dogs · pickups</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-[var(--color-trail-600)]"
                  style={{ width: `${route.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-stone-200 bg-white p-3">
          <p className="text-xs font-medium text-stone-500">Recent activity</p>
          <ul className="mt-2 space-y-1.5 text-xs text-stone-600">
            <li>Cooper picked up · Burnaby route</li>
            <li>ETA sent to Sam Patel · Vancouver route</li>
            <li>Skip request received · “Skip Friday”</li>
          </ul>
        </div>
      </div>
    </MockWindow>
  );
}

export function SmsPhoneMock() {
  const messages = [
    {
      outbound: true,
      text: "Hi Sam! Cooper and Daisy are booked for a hike tomorrow and will be picked up between 8:05 AM and 8:35 AM.",
    },
    {
      outbound: true,
      text: "Hi Sam! We’re on the way to pick up Cooper. ETA is approximately 12 minutes.",
    },
    { outbound: false, text: "Skip Friday" },
    {
      outbound: true,
      text: "Got it! We’ll review your request shortly.",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-xs">
      <div className="overflow-hidden rounded-[2rem] border-4 border-stone-800 bg-stone-900 p-2 shadow-2xl">
        <div className="rounded-[1.5rem] bg-stone-100 px-3 pb-4 pt-8">
          <div className="mb-4 text-center">
            <p className="text-xs font-medium text-stone-500">PackRoute</p>
            <p className="text-sm font-semibold text-stone-800">Trail Tails</p>
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

export function DriverMobileMock() {
  const stops = [
    { name: "Cooper", status: "En Route", active: true },
    { name: "Daisy", status: "Scheduled", active: false },
    { name: "Rocky", status: "Scheduled", active: false },
  ];

  return (
    <div className="mx-auto w-full max-w-xs">
      <div className="overflow-hidden rounded-[2rem] border-4 border-stone-800 bg-[var(--color-trail-800)] shadow-2xl">
        <div className="px-4 pb-5 pt-6">
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/50">
            PackRoute · Driver
          </p>
          <p className="mt-1 text-sm text-white/90">Sam Patel</p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-200 ring-1 ring-green-400/30">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            Location active
          </div>

          <p className="mt-5 text-xs font-medium uppercase tracking-wide text-white/50">
            Morning pickups
          </p>
          <ul className="mt-2 space-y-2">
            {stops.map((stop) => (
              <li
                key={stop.name}
                className="rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-white">{stop.name}</p>
                  <span className="text-[10px] text-white/60">{stop.status}</span>
                </div>
                {stop.active ? (
                  <button
                    type="button"
                    className="mt-2 w-full rounded-lg bg-[var(--color-trail-600)] py-2 text-xs font-medium text-white"
                  >
                    En Route
                  </button>
                ) : (
                  <div className="mt-2 h-8 rounded-lg bg-white/5" />
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardMock() {
  return (
    <MockWindow>
      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
        <div className="rounded-xl border border-stone-200 bg-white p-4 sm:col-span-2">
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

        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm font-semibold text-stone-900">Billing period</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-trail-700)]">142</p>
          <p className="text-xs text-stone-500">Completed hikes · export CSV</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm font-semibold text-stone-900">Notifications</p>
          <ul className="mt-2 space-y-1 text-xs text-stone-600">
            <li>Night-before reminders sent</li>
            <li>12 ETA texts today</li>
            <li>3 pickup confirmations</li>
          </ul>
        </div>
      </div>
    </MockWindow>
  );
}
