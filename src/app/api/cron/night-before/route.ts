import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runNightBeforeCron } from "@/features/notifications/night-before";
import { logWarn } from "@/lib/logger";
import { perfAsync } from "@/lib/perf";

function secretsMatch(expected: string, provided: string | null): boolean {
  if (!provided) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!secret) {
    logWarn("cron", "CRON_SECRET not configured — night-before cron disabled");
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }

  if (!secretsMatch(secret, bearer)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await perfAsync("api cron/night-before", () =>
    runNightBeforeCron()
  );
  return NextResponse.json({ ok: true, results });
}
