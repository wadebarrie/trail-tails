import { NextResponse } from "next/server";
import { runNightBeforeCron } from "@/features/notifications/night-before";
import { logWarn } from "@/lib/logger";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const querySecret = new URL(request.url).searchParams.get("secret");

  if (!secret) {
    logWarn("cron", "CRON_SECRET not configured — night-before cron disabled");
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }

  if (bearer !== secret && querySecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runNightBeforeCron();
  return NextResponse.json({ ok: true, results });
}
