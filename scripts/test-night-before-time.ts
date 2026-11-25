import assert from "node:assert/strict";
import {
  nightBeforeBudgetExhausted,
  nightBeforeConfirmPlan,
  nightBeforePhonesToSend,
  nightBeforePriorDecision,
  nightBeforeSendDecision,
} from "../src/features/notifications/night-before-schedule";

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

test("a sent night-before row is not sent again", () => {
  assert.equal(
    nightBeforePriorDecision([{ status: "sent", errorMessage: null }]),
    "skip"
  );
});

test("a budget skip is retried and an unconfirmed row is checked first", () => {
  assert.equal(
    nightBeforePriorDecision([
      { status: "pending", errorMessage: "Skipped — request time budget exhausted" },
    ]),
    "send"
  );
  assert.equal(
    nightBeforePriorDecision([
      { status: "pending", errorMessage: "Twilio send not confirmed" },
    ]),
    "confirm"
  );
  assert.equal(
    nightBeforePriorDecision([
      { status: "sent", errorMessage: null },
      { status: "pending", errorMessage: "Twilio send not confirmed" },
    ]),
    "confirm"
  );
  assert.equal(
    nightBeforePriorDecision([
      { status: "sent", errorMessage: null },
      {
        status: "pending",
        errorMessage: "Skipped — request time budget exhausted",
      },
    ]),
    "send"
  );
});

test("a sent primary contact does not block a skipped secondary contact", () => {
  const targets = nightBeforePhonesToSend({
    contacts: [
      { phone: "+15551111", ownerName: "Rachel Lee" },
      { phone: "+15552222", ownerName: "Sam Lee" },
    ],
    rows: [
      { status: "sent", errorMessage: null, body: "Hi Rachel! Daisy tomorrow." },
      {
        status: "pending",
        errorMessage: "Skipped — request time budget exhausted",
        body: "Hi Sam! Daisy tomorrow.",
      },
    ],
    bodyFor: (name) => `Hi ${name.split(" ")[0]}! Daisy tomorrow.`,
  });
  assert.deepEqual(targets, { phones: ["+15552222"], ambiguous: false });
});

test("identical bodies are not guessed", () => {
  const targets = nightBeforePhonesToSend({
    contacts: [
      { phone: "+15551111", ownerName: "Rachel Lee" },
      { phone: "+15552222", ownerName: "Sam Lee" },
    ],
    rows: [
      { status: "sent", errorMessage: null, body: "Tomorrow: Daisy 8-10." },
      {
        status: "pending",
        errorMessage: "Skipped — request time budget exhausted",
        body: "Tomorrow: Daisy 8-10.",
      },
    ],
    bodyFor: () => "Tomorrow: Daisy 8-10.",
  });
  assert.deepEqual(targets, { phones: [], ambiguous: true });
});

test("a company is skipped once under a second remains", () => {
  assert.equal(nightBeforeBudgetExhausted(null), false);
  assert.equal(nightBeforeBudgetExhausted(1000), false);
  assert.equal(nightBeforeBudgetExhausted(999), true);
  assert.equal(nightBeforeBudgetExhausted(0), true);
});

test("an unconfirmed row is confirmed for that contact only", () => {
  const contacts = [
    { phone: "+15551111", ownerName: "Rachel Lee" },
    { phone: "+15552222", ownerName: "Sam Lee" },
  ];
  const bodyFor = (name: string) => `Hi ${name.split(" ")[0]}!`;
  const plan = nightBeforeConfirmPlan({
    contacts,
    rows: [
      {
        id: "rachel",
        status: "pending",
        errorMessage: "Twilio send not confirmed",
        body: "Hi Rachel!",
        createdAt: "2026-11-25T03:00:00.000Z",
      },
      {
        id: "sam",
        status: "pending",
        errorMessage: "Twilio send not confirmed",
        body: "Hi Sam!",
        createdAt: "2026-11-25T03:01:00.000Z",
      },
    ],
    bodyFor,
  });
  assert.deepEqual(
    plan.unique.map((match) => match.rowId),
    ["rachel", "sam"]
  );
  assert.equal(plan.shared.length, 0);
  assert.equal(plan.unique[0].phone, "+15551111");
  assert.equal(plan.unique[1].phone, "+15552222");
});

test("a shared body is not paired to one contact", () => {
  const plan = nightBeforeConfirmPlan({
    contacts: [
      { phone: "+15551111", ownerName: "Rachel Lee" },
      { phone: "+15552222", ownerName: "Sam Lee" },
    ],
    rows: [
      {
        id: "a",
        status: "pending",
        errorMessage: "Twilio send not confirmed",
        body: "Tomorrow: Daisy 8-10.",
      },
    ],
    bodyFor: () => "Tomorrow: Daisy 8-10.",
  });
  assert.equal(plan.unique.length, 0);
  assert.equal(plan.shared.length, 1);
  assert.deepEqual(plan.shared[0].rowIds, ["a"]);
  assert.equal(plan.shared[0].contacts.length, 2);
});

console.log("\nAll night-before time tests passed.");
