import assert from "node:assert/strict";
import { deriveBillingStatus } from "../src/features/billing/status";

function test(name: string, fn: () => void) {
  fn();
  console.log(`✓ ${name}`);
}

test("picked_up is billable", () => {
  const r = deriveBillingStatus("picked_up", "scheduled", "2025-06-01", "2025-06-25");
  assert.equal(r.billable, true);
  assert.equal(r.billingStatus, "completed");
});

test("dropped_off is billable", () => {
  const r = deriveBillingStatus("scheduled", "dropped_off", "2025-06-01", "2025-06-25");
  assert.equal(r.billable, true);
});

test("cancelled is not billable", () => {
  const r = deriveBillingStatus("cancelled", null, "2025-06-01", "2025-06-25");
  assert.equal(r.billable, false);
  assert.equal(r.billingStatus, "cancelled");
});

test("past scheduled is no_show", () => {
  const r = deriveBillingStatus("scheduled", null, "2025-06-01", "2025-06-25");
  assert.equal(r.billingStatus, "no_show");
  assert.equal(r.billable, false);
});

test("future scheduled is pending", () => {
  const r = deriveBillingStatus("scheduled", null, "2025-06-30", "2025-06-25");
  assert.equal(r.billingStatus, "pending");
});

console.log("\nAll billing status tests passed.");
