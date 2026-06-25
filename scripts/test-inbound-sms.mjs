/**
 * Simulate a Twilio inbound SMS POST (with valid signature).
 *
 * Usage:
 *   node scripts/test-inbound-sms.mjs "SKIP TOMORROW"
 *   node scripts/test-inbound-sms.mjs --from +15555550101 "SKIP TOMORROW"
 *   node scripts/test-inbound-sms.mjs --url http://localhost:3000/api/webhooks/twilio "SKIP TOMORROW"
 *
 * For local dev: TWILIO_WEBHOOK_URL must match --url (or unset so the server uses the request URL).
 * For production: omit --url to use TWILIO_WEBHOOK_URL from .env.local.
 */

import { createHmac, randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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

const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
const fromDefault = process.env.TWILIO_PHONE_NUMBER?.trim() ?? "+15551234567";

if (!authToken) {
  console.error("Missing TWILIO_AUTH_TOKEN in .env.local");
  process.exit(1);
}

const args = process.argv.slice(2);
let webhookUrl =
  process.env.TWILIO_WEBHOOK_URL?.trim() ??
  "http://localhost:3000/api/webhooks/twilio";
let fromNumber = "+15555550101";
const bodyParts = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--url" && args[i + 1]) {
    webhookUrl = args[++i];
  } else if (args[i] === "--from" && args[i + 1]) {
    fromNumber = args[++i];
  } else {
    bodyParts.push(args[i]);
  }
}

const body = bodyParts.join(" ") || "SKIP TOMORROW";
const toNumber = fromDefault;
const messageSid = `SM${randomUUID().replace(/-/g, "").slice(0, 32)}`;

const params = {
  From: fromNumber,
  To: toNumber,
  Body: body,
  MessageSid: messageSid,
};

function signTwilioWebhook(url, formParams) {
  const sortedKeys = Object.keys(formParams).sort();
  let payload = url;
  for (const key of sortedKeys) {
    payload += key + formParams[key];
  }
  return createHmac("sha1", authToken).update(payload, "utf8").digest("base64");
}

const signature = signTwilioWebhook(webhookUrl, params);
const form = new URLSearchParams(params);

console.log("POST", webhookUrl);
console.log("From:", fromNumber);
console.log("Body:", body);
console.log("MessageSid:", messageSid);

const res = await fetch(webhookUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "X-Twilio-Signature": signature,
  },
  body: form.toString(),
});

const text = await res.text();
console.log("\nStatus:", res.status);
console.log("Response:", text);

if (res.status === 403) {
  console.error(
    "\nSignature rejected. For local dev, set TWILIO_WEBHOOK_URL=http://localhost:3000/api/webhooks/twilio"
  );
  console.error("Or pass --url matching TWILIO_WEBHOOK_URL exactly.");
  process.exit(1);
}

if (!res.ok) {
  process.exit(1);
}

if (text.includes("Got it")) {
  console.log("\n✓ Pending request should be created. Check /dashboard/pending-requests");
} else if (text.includes("don&apos;t recognize") || text.includes("don't recognize")) {
  console.error("\n✗ Phone not matched to any customer.");
  console.error("  Run: node scripts/list-customer-phones.mjs");
  console.error('  Then: npm run test:inbound-sms -- --from +1XXXXXXXXXX "SKIP TOMORROW"');
  process.exit(1);
} else if (text.includes("HELP")) {
  console.log("\n✓ HELP reply sent (no pending request).");
} else {
  console.log("\n✓ TwiML reply received.");
}
