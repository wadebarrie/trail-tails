/**
 * Test Geocoding API v4 with GOOGLE_MAPS_API_KEY from .env.local
 * Usage: node scripts/test-geocode.mjs
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
}

const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
if (!key) {
  console.error("GOOGLE_MAPS_API_KEY missing in .env.local");
  process.exit(1);
}

console.log("Key loaded:", `${key.slice(0, 6)}…${key.slice(-4)} (${key.length} chars)`);

const address = process.argv[2] ?? "123 Forest Ave, Portland, OR 97201";
const url = `https://geocode.googleapis.com/v4/geocode/address/${encodeURIComponent(address)}`;

const res = await fetch(url, { headers: { "X-Goog-Api-Key": key } });
const data = await res.json().catch(() => ({}));

console.log("Endpoint: Geocoding API v4");
console.log("HTTP:", res.status);

if (data.results?.[0]?.location) {
  const { latitude, longitude } = data.results[0].location;
  console.log("Status: OK");
  console.log("Lat/lng:", latitude, longitude);
  console.log("Formatted:", data.results[0].formattedAddress);
} else {
  console.log("Status: FAILED");
  console.log("Google error:", data.error?.message ?? JSON.stringify(data));
  process.exit(1);
}
