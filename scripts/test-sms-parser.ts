import assert from "node:assert/strict";
import {
  parseSmsCommand,
  nextDateForWeekday,
  nextWeekdayWeekRange,
} from "../src/features/sms/parser";

const TZ = "America/Los_Angeles";

function test(name: string, fn: () => void) {
  fn();
  console.log(`✓ ${name}`);
}

test("HELP", () => {
  const r = parseSmsCommand("help", TZ, "2025-06-25");
  assert.equal(r.commandType, "help");
  assert.equal(r.createsRequest, false);
  assert.ok(r.autoReplies && r.autoReplies.length >= 2);
});

test("help please", () => {
  const r = parseSmsCommand("help please", TZ, "2025-06-25");
  assert.equal(r.commandType, "help");
});

test("SKIP TOMORROW", () => {
  const r = parseSmsCommand("SKIP TOMORROW", TZ, "2025-06-25");
  assert.equal(r.commandType, "skip_tomorrow");
  assert.equal(r.createsRequest, true);
  if (r.createsRequest) {
    assert.equal(r.payload.target_date, "2025-06-26");
  }
});

test("no hike tomorrow", () => {
  const r = parseSmsCommand("no hike tomorrow", TZ, "2025-06-25");
  assert.equal(r.commandType, "skip_tomorrow");
});

test("skip next hike", () => {
  const r = parseSmsCommand("skip next hike", TZ, "2025-06-25");
  assert.equal(r.commandType, "skip_tomorrow");
});

test("skip next week", () => {
  const r = parseSmsCommand("skip next week", TZ, "2025-06-25");
  assert.equal(r.commandType, "vacation");
  if (r.createsRequest) {
    assert.equal(r.payload.start_date, "2025-06-30");
    assert.equal(r.payload.end_date, "2025-07-04");
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

test("going on vacation until july 18", () => {
  const r = parseSmsCommand(
    "going on vacation until july 18",
    TZ,
    "2025-06-25"
  );
  assert.equal(r.commandType, "vacation");
  if (r.createsRequest) {
    assert.equal(r.payload.start_date, "2025-06-25");
    assert.equal(r.payload.end_date, "2025-07-18");
  }
});

test("vacation july 10 to july 18", () => {
  const r = parseSmsCommand("vacation july 10 to july 18", TZ, "2025-06-25");
  assert.equal(r.commandType, "vacation");
  if (r.createsRequest) {
    assert.equal(r.payload.start_date, "2025-07-10");
    assert.equal(r.payload.end_date, "2025-07-18");
  }
});

test("away july 10-18", () => {
  const r = parseSmsCommand("away july 10-18", TZ, "2025-06-25");
  assert.equal(r.commandType, "vacation");
});

test("PAUSE", () => {
  const r = parseSmsCommand("pause", TZ, "2025-06-25");
  assert.equal(r.commandType, "pause");
  if (r.createsRequest) {
    assert.equal(r.payload.start_date, "2025-06-25");
    assert.equal(r.payload.end_date, null);
  }
});

test("take a break", () => {
  const r = parseSmsCommand("take a break", TZ, "2025-06-25");
  assert.equal(r.commandType, "pause");
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

test("nextWeekdayWeekRange from Wednesday", () => {
  const range = nextWeekdayWeekRange("2025-06-25");
  assert.equal(range.start_date, "2025-06-30");
  assert.equal(range.end_date, "2025-07-04");
});

console.log("\nAll SMS parser tests passed.");
