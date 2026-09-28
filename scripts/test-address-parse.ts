import assert from "node:assert/strict";
import {
  coerceStructuredCustomerAddress,
  customerAddressFormDefaults,
  parseFreeformAddress,
} from "../src/lib/address";

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

test("Form defaults split legacy freeform address", () => {
  const d = customerAddressFormDefaults({
    address: "225 Mowat Street, New Westminster, BC V3M 5R2",
    address_line1: "225 Mowat Street, New Westminster, BC V3M 5R2",
    address_line2: null,
    city: null,
    state_province: null,
    postal_code: null,
  });
  assert.equal(d.address_line1, "225 Mowat Street");
  assert.equal(d.city, "New Westminster");
  assert.equal(d.state_province, "BC");
  assert.equal(d.postal_code, "V3M 5R2");
});

test("Form defaults keep existing structured fields", () => {
  const d = customerAddressFormDefaults({
    address: "225 Mowat Street, New Westminster, BC V3M 5R2",
    address_line1: "225 Mowat Street",
    address_line2: "301",
    city: "New Westminster",
    state_province: "BC",
    postal_code: "V3M 5R2",
  });
  assert.equal(d.address_line1, "225 Mowat Street");
  assert.equal(d.address_line2, "301");
  assert.equal(d.city, "New Westminster");
});

test("Save coerce splits freeform line1 when locality blank", () => {
  const c = coerceStructuredCustomerAddress({
    address_line1: "888 Carnarvon St, New Westminster BC V3M 0C6",
    address_line2: "",
    city: "",
    state_province: "",
    postal_code: "",
  });
  assert.equal(c.address_line1, "888 Carnarvon St");
  assert.equal(c.city, "New Westminster");
  assert.equal(c.state_province, "BC");
  assert.equal(c.postal_code, "V3M 0C6");
});

test("Form defaults do not treat unit as city", () => {
  const d = customerAddressFormDefaults({
    address: "225 Mowat Street, 301",
    address_line1: "225 Mowat Street, 301",
    city: null,
    state_province: null,
    postal_code: null,
  });
  assert.equal(d.address_line1, "225 Mowat Street, 301");
  assert.equal(d.city, "");
  assert.equal(d.state_province, "");
  assert.equal(d.postal_code, "");
});

console.log("All address parser tests passed.");
