/**
 * Test Routes API ETA with GOOGLE_MAPS_API_KEY from .env.local
 * Usage: node scripts/test-eta.mjs [originLat,originLng] [destLat,destLng]
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

function parsePoint(arg, fallback) {
  if (!arg) return fallback;
  const [lat, lng] = arg.split(",").map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    console.error("Invalid coordinates:", arg);
    process.exit(1);
  }
  return { lat, lng };
}

const origin = parsePoint(process.argv[2], { lat: 45.5231, lng: -122.6765 });
const destination = parsePoint(process.argv[3], { lat: 45.5152, lng: -122.6784 });

const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": key,
    "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
  },
  body: JSON.stringify({
    origin: {
      location: { latLng: { latitude: origin.lat, longitude: origin.lng } },
    },
    destination: {
      location: {
        latLng: { latitude: destination.lat, longitude: destination.lng },
      },
    },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
  }),
});

const data = await res.json().catch(() => ({}));

console.log("Endpoint: Routes API (computeRoutes)");
console.log("HTTP:", res.status);
console.log("Origin:", origin);
console.log("Destination:", destination);

const route = data.routes?.[0];
const duration = route?.duration;
if (res.ok && duration) {
  const seconds = Number(String(duration).replace(/s$/, ""));
  const minutes = Math.max(1, Math.round(seconds / 60));
  console.log("Status: OK");
  console.log("ETA:", minutes, "minutes");
  console.log("Distance:", route.distanceMeters, "meters");
} else {
  console.log("Status: FAILED");
  console.log("Error:", data.error?.message ?? JSON.stringify(data));
  process.exit(1);
}
