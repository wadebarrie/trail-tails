import { NextResponse } from "next/server";
import { getClientEnv } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";
import { logErrorFromException } from "@/lib/logger";

export async function GET() {
  try {
    getClientEnv();
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createServiceClient();
      const { error } = await supabase
        .from("companies")
        .select("id", { count: "exact", head: true });

      if (error) {
        logErrorFromException("system", "Database health check failed", error);
        return NextResponse.json({ status: "error" }, { status: 503 });
      }
    } catch (err) {
      logErrorFromException("system", "Health check exception", err);
      return NextResponse.json({ status: "error" }, { status: 503 });
    }
  }

  return NextResponse.json({ status: "ok" });
}
