/** Lightweight dev timing — set PERF_LOGGING=1 to enable in production. */
export function isPerfEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.PERF_LOGGING === "1"
  );
}

export function perfLog(label: string, durationMs: number, detail?: string) {
  if (!isPerfEnabled()) return;
  const suffix = detail ? ` (${detail})` : "";
  console.log(`[PERF] ${label}: ${Math.round(durationMs)}ms${suffix}`);
}

export async function perfAsync<T>(
  label: string,
  fn: () => Promise<T>,
  detail?: string
): Promise<T> {
  if (!isPerfEnabled()) return fn();
  const start = performance.now();
  try {
    return await fn();
  } finally {
    perfLog(label, performance.now() - start, detail);
  }
}

/** Step timings for multi-phase operations (driver actions, page loads). */
export class PerfTimer {
  private start = performance.now();
  private last = this.start;

  constructor(private label: string) {}

  mark(step: string) {
    if (!isPerfEnabled()) return;
    const now = performance.now();
    perfLog(`${this.label} ${step}`, now - this.last);
    this.last = now;
  }

  end(detail?: string) {
    if (!isPerfEnabled()) return;
    perfLog(`${this.label} total`, performance.now() - this.start, detail);
  }
}
