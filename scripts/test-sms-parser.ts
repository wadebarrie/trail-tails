import assert from "node:assert/strict";
import { parseSmsCommand, nextDateForWeekday } from "../src/features/sms/parser";

const TZ = "America/Los_Angeles";

function test(name: string, fn: () => void) {
  fn();
  console.log(`✓ ${name}`);
}

test("HELP", () => {
  const r = parseSmsCommand("help", TZ, "2025-06-25");
  assert.equal(r.commandType, "help");
  assert.equal(r.createsRequest, false);
});

test("SKIP TOMORROW", () => {
  const r = parseSmsCommand("SKIP TOMORROW", TZ, "2025-06-25");
  assert.equal(r.commandType, "skip_tomorrow");
  assert.equal(r.createsRequest, true);
  if (r.createsRequest) {
    assert.equal(r.payload.target_date, "2025-06-26");
  }
});

test("SKIP MONDAY", () => {
  const r = parseSmsCommand("SKIP MONDAY", TZ, "2025-06-25");
  assert.equal(r.commandType, "skip_weekday");
  if (r.createsRequest) {
    assert.equal(r.payload.day_of_week, 1);
    assert.equal(r.payload.target_date, "2025-06-30");
  }
});

test("SKIP 7/10", () => {
  const r = parseSmsCommand("SKIP 7/10", TZ, "2025-06-25");
  assert.equal(r.commandType, "skip_date");
  if (r.createsRequest) {
    assert.equal(r.payload.target_date, "2025-07-10");
  }
});

test("VACATION range", () => {
  const r = parseSmsCommand("VACATION JULY 10-18", TZ, "2025-06-25");
  assert.equal(r.commandType, "vacation");
  if (r.createsRequest) {
    assert.equal(r.payload.start_date, "2025-07-10");
    assert.equal(r.payload.end_date, "2025-07-18");
  }
});

test("PAUSE", () => {
  const r = parseSmsCommand("pause", TZ, "2025-06-25");
  assert.equal(r.commandType, "pause");
  if (r.createsRequest) {
    assert.equal(r.payload.start_date, "2025-06-25");
    assert.equal(r.payload.end_date, null);
  }
});

test("RESUME", () => {
  const r = parseSmsCommand("back on", TZ, "2025-06-25");
  assert.equal(r.commandType, "resume");
  assert.equal(r.createsRequest, true);
});

test("unknown command", () => {
  const r = parseSmsCommand("hello there", TZ, "2025-06-25");
  assert.equal(r.commandType, "unknown");
  assert.equal(r.createsRequest, false);
});

test("nextDateForWeekday", () => {
  assert.equal(nextDateForWeekday("2025-06-25", 1), "2025-06-30");
});

console.log("\nAll SMS parser tests passed.");
