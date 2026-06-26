/**
 * Verify Twilio credentials from .env.local (does not send SMS by default).
 * Usage:
 *   node scripts/test-twilio.mjs           # auth check only
 *   node scripts/test-twilio.mjs --send +1…  # send test SMS to number
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

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim();
const webhookUrl = process.env.TWILIO_WEBHOOK_URL?.trim();

if (!accountSid || !authToken || !fromNumber) {
  console.error("Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER");
  process.exit(1);
}

console.log("Account SID:", accountSid.slice(0, 6) + "…");
console.log("From number:", fromNumber);
console.log(
  "Webhook URL:",
  webhookUrl?.includes("your-netlify") ? "⚠ still placeholder" : webhookUrl ?? "(not set)"
);

const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

const accountRes = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
  { headers: { Authorization: `Basic ${auth}` } }
);
const accountData = await accountRes.json();

if (!accountRes.ok) {
  console.error("Auth failed:", accountData.message ?? accountRes.status);
  process.exit(1);
}

console.log("Auth: OK — account", accountData.friendly_name ?? accountData.status);

const sendFlag = process.argv.indexOf("--send");
if (sendFlag !== -1) {
  const to = process.argv[sendFlag + 1];
  if (!to) {
    console.error("Usage: node scripts/test-twilio.mjs --send +15551234567");
    process.exit(1);
  }

  const params = new URLSearchParams({
    To: to,
    From: fromNumber,
    Body: "PackRoute test — Twilio is connected.",
  });

  const sendRes = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );
  const sendData = await sendRes.json();

  if (!sendRes.ok) {
    console.error("Send failed:", sendData.message ?? sendRes.status);
    process.exit(1);
  }

  console.log("Send: OK — SID", sendData.sid);
} else {
  console.log("Outbound SMS ready. Driver En Route / Arrived / Picked Up will text customers.");
  console.log("Optional live send: npm run test:twilio -- --send +1YOURPHONE");
}
