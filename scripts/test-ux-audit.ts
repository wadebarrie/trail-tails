import assert from "node:assert/strict";
import { vehicleLoadWarningMessages } from "../src/features/vehicles/load-warnings.ts";
import { formatPhoneDisplay } from "../src/lib/phone.ts";
import { humanRequestReason } from "../src/features/pending-requests/labels.ts";

const ranger = {
  vehicleId: "van-1",
  vehicleLabel: "White Ford Ranger",
  capacity: 4,
  period: "morning" as const,
  earliestStart: "08:00:00",
  latestEnd: "09:00:00",
};

const warnings = vehicleLoadWarningMessages([
  { ...ranger, routeId: "a", routeName: "Burnaby", dogCount: 8 },
  { ...ranger, routeId: "b", routeName: "New West", dogCount: 8 },
]);

assert.ok(warnings.some((message) => message.includes("16 / 4")));
assert.ok(warnings.some((message) => message.includes("Burnaby") && message.includes("New West")));

const separatePeriods = vehicleLoadWarningMessages([
  { ...ranger, routeId: "a", routeName: "Morning", dogCount: 3 },
  {
    ...ranger,
    routeId: "b",
    routeName: "Afternoon",
    period: "afternoon",
    dogCount: 3,
    earliestStart: "15:00:00",
    latestEnd: "16:00:00",
  },
]);
assert.equal(separatePeriods.length, 0);

assert.equal(formatPhoneDisplay("+16046792410"), "(604) 679-2410");
assert.equal(formatPhoneDisplay("+1604679241"), "+1604679241");
assert.equal(humanRequestReason("SMS: skip_tomorrow"), "Skip tomorrow");
assert.equal(humanRequestReason("Family vacation"), "Family vacation");

console.log("vehicle load, phone, and request labels ok");
