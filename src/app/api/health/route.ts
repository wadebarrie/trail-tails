import { NextResponse } from "next/server";
import { getClientEnv } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  try {
    getClientEnv();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Missing env vars";
    return NextResponse.json({ status: "error", message }, { status: 503 });
  }

  const payload: Record<string, unknown> = {
    status: "ok",
    app: "trail-tails",
  };

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createServiceClient();
      const { count, error } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true });

      payload.database = error ? "error" : "connected";
      if (!error) payload.companies = count ?? 0;
      if (error) payload.databaseError = error.message;
    } catch (err) {
      payload.database = "error";
      payload.databaseError =
        err instanceof Error ? err.message : "Unknown error";
    }
  } else {
    payload.database = "skipped";
    payload.note = "Set SUPABASE_SERVICE_ROLE_KEY for DB health check";
  }

  return NextResponse.json(payload);
}
