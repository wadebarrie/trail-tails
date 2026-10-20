import assert from "node:assert/strict";
import { nightBeforeSendDecision } from "../src/features/notifications/night-before-schedule";

function test(name: string, fn: () => void) {
  fn();
  console.log(`✓ ${name}`);
}

const TZ = "America/Vancouver";
const REMINDER = "19:30:00";

test("7:29 PM Pacific is before the reminder", () => {
  // 2026-10-19 19:29 PDT = 2026-10-20 02:29 UTC
  const at = new Date("2026-10-20T02:29:00.000Z");
  const decision = nightBeforeSendDecision(TZ, REMINDER, at);
  assert.equal(decision.send, false);
  if (!decision.send) assert.equal(decision.reason, "before_reminder_time");
});

test("7:30 PM Pacific is the send window", () => {
  // 2026-10-19 19:30 PDT = 2026-10-20 02:30 UTC
  const at = new Date("2026-10-20T02:30:00.000Z");
  assert.equal(nightBeforeSendDecision(TZ, REMINDER, at).send, true);
});

test("3:00 AM Pacific does not send a night-before text", () => {
  // 2026-10-20 03:00 PDT = 2026-10-20 10:00 UTC
  const at = new Date("2026-10-20T10:00:00.000Z");
  const decision = nightBeforeSendDecision(TZ, REMINDER, at);
  assert.equal(decision.send, false);
  if (!decision.send) assert.equal(decision.reason, "before_reminder_time");
});

test("6:00 AM Pacific does not send a night-before text", () => {
  const at = new Date("2026-10-20T13:00:00.000Z");
  assert.equal(nightBeforeSendDecision(TZ, REMINDER, at).send, false);
});

test("5:00 AM Pacific is the morning sync, not a text", () => {
  // 2026-10-20 05:00 PDT = 2026-10-20 12:00 UTC
  const at = new Date("2026-10-20T12:00:00.000Z");
  const decision = nightBeforeSendDecision(TZ, REMINDER, at);
  assert.equal(decision.send, false);
  if (!decision.send) assert.equal(decision.reason, "morning_sync");
});

test("7:30 PM Eastern is its own send window (DST)", () => {
  // 2026-10-19 19:30 EDT = 2026-10-19 23:30 UTC
  const at = new Date("2026-10-19T23:30:00.000Z");
  assert.equal(
    nightBeforeSendDecision("America/New_York", REMINDER, at).send,
    true
  );
  const earlier = new Date("2026-10-19T23:00:00.000Z");
  assert.equal(
    nightBeforeSendDecision("America/New_York", REMINDER, earlier).send,
    false
  );
});

test("standard time still uses the company clock (PST)", () => {
  // 2026-01-15 19:30 PST = 2026-01-16 03:30 UTC
  const at = new Date("2026-01-16T03:30:00.000Z");
  assert.equal(nightBeforeSendDecision(TZ, REMINDER, at).send, true);
  const morning = new Date("2026-01-16T11:00:00.000Z"); // 03:00 PST
  assert.equal(nightBeforeSendDecision(TZ, REMINDER, morning).send, false);
});

console.log("\nAll night-before time tests passed.");
