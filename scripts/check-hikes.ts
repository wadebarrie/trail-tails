import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createServiceClient } from "../src/lib/supabase/service";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    if (!process.env[t.slice(0, eq)]) process.env[t.slice(0, eq)] = t.slice(eq + 1);
  }
}

async function main() {
  const supabase = createServiceClient();
  const routeId = "d0000000-0000-0000-0000-000000000002";
  const { data: days } = await supabase
    .from("route_schedule_days")
    .select("day_of_week")
    .eq("route_id", routeId);
  console.log("route schedule days:", days?.map((d) => d.day_of_week).sort());

  const { data } = await supabase
    .from("hikes")
    .select("id, date, status, stops(id, stop_type, status, dogs(name))")
    .eq("route_id", routeId)
    .gte("date", "2026-06-26")
    .lte("date", "2026-06-28")
    .order("date");
  for (const h of data ?? []) {
    const stops = (h.stops ?? []) as {
      stop_type: string;
      status: string;
      dogs: { name: string }[];
    }[];
    console.log(
      h.date,
      h.status,
      `total=${stops.length}`,
      stops
        .map(
          (s) =>
            `${s.dogs?.[0]?.name ?? "?"}:${s.stop_type}:${s.status}`
        )
        .join(", ")
    );
  }
}

main();
