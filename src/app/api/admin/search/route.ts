import { NextResponse } from "next/server";
import { searchAdminEntities } from "@/features/admin/search";
import { logErrorFromException } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    const hits = await searchAdminEntities(q);
    return NextResponse.json({ hits });
  } catch (error) {
    logErrorFromException("system", "Admin search failed", error);
    return NextResponse.json({ hits: [], error: "Search failed" }, { status: 500 });
  }
}
