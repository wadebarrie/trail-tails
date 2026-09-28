import assert from "node:assert/strict";
import { parseFreeformAddress } from "../src/lib/address";

function test(name: string, fn: () => void) {
  fn();
  console.log(`✓ ${name}`);
}

test("Canadian comma-separated address", () => {
  const p = parseFreeformAddress("2142 W 4th Ave, Vancouver, BC V6K 1N6");
  assert.equal(p.address_line1, "2142 W 4th Ave");
  assert.equal(p.city, "Vancouver");
  assert.equal(p.state_province, "BC");
  assert.equal(p.postal_code, "V6K 1N6");
});

test("Canadian without commas before province", () => {
  const p = parseFreeformAddress("2142 W 4th Ave, Vancouver BC V6K1N6");
  assert.equal(p.address_line1, "2142 W 4th Ave");
  assert.equal(p.city, "Vancouver");
  assert.equal(p.state_province, "BC");
  assert.equal(p.postal_code, "V6K 1N6");
});

test("Street only stays in line1", () => {
  const p = parseFreeformAddress("2142 W 4th Ave");
  assert.equal(p.address_line1, "2142 W 4th Ave");
  assert.equal(p.city, null);
  assert.equal(p.state_province, null);
  assert.equal(p.postal_code, null);
});

test("US zip", () => {
  const p = parseFreeformAddress("1200 NW Glisan St, Portland, OR 97209");
  assert.equal(p.address_line1, "1200 NW Glisan St");
  assert.equal(p.city, "Portland");
  assert.equal(p.state_province, "OR");
  assert.equal(p.postal_code, "97209");
});

test("Unit / line2", () => {
  const p = parseFreeformAddress("100 Main St, Apt 4, Burnaby, BC V5H 0A1");
  assert.equal(p.address_line1, "100 Main St");
  assert.equal(p.address_line2, "Apt 4");
  assert.equal(p.city, "Burnaby");
  assert.equal(p.state_province, "BC");
  assert.equal(p.postal_code, "V5H 0A1");
});

console.log("All address parser tests passed.");
