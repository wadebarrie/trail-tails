import assert from "node:assert/strict";
import {
  buildHikeGalleryMessage,
  galleryLinkAlreadySent,
  galleryWhenLabel,
} from "../src/features/hike-photos/gallery-sms-rules";
import { smsStatusTone, smsTypeLabel } from "../src/features/sms/labels";

function test(name: string, fn: () => void) {
  fn();
  console.log(`✓ ${name}`);
}

test("today copy stays short", () => {
  assert.equal(
    buildHikeGalleryMessage(["Daisy"], "https://packroute.app/p/abc"),
    "Daisy had a great hike today! See the pics: https://packroute.app/p/abc"
  );
});

test("older close-out names the date", () => {
  const when = galleryWhenLabel("2026-11-24", "2026-11-25", "America/Vancouver");
  assert.match(when, /^on /);
  assert.doesNotMatch(when, /today/);
  const body = buildHikeGalleryMessage(["Daisy", "Mochi"], "https://packroute.app/p/abc", when);
  assert.match(body, /^Daisy and Mochi had a great hike on /);
  assert.doesNotMatch(body, /today/);
});

test("same-day label is today", () => {
  assert.equal(
    galleryWhenLabel("2026-11-25", "2026-11-25", "America/Vancouver"),
    "today"
  );
});

test("failed gallery send does not block a retry", () => {
  assert.equal(
    galleryLinkAlreadySent(
      [
        {
          status: "failed",
          notificationType: "hike_photos",
          body: "Daisy had a great hike today! See the pics: https://packroute.app/p/tokenA",
        },
      ],
      ["tokenA"]
    ),
    false
  );
});

test("sent gallery text blocks a second text that day", () => {
  assert.equal(
    galleryLinkAlreadySent(
      [
        {
          status: "sent",
          notificationType: "hike_photos",
          body: "Daisy had a great hike today! See the pics: https://packroute.app/p/tokenA",
        },
      ],
      ["tokenB", "tokenA"]
    ),
    true
  );
});

test("drop-off text that included the link counts as sent", () => {
  assert.equal(
    galleryLinkAlreadySent(
      [
        {
          status: "sent",
          notificationType: "dropped_off",
          body: "Daisy has been dropped off. Have a great day! Photos from the hike: https://packroute.app/p/tokenA",
        },
      ],
      ["tokenA"]
    ),
    true
  );
});

test("drop-off without a photo link does not count", () => {
  assert.equal(
    galleryLinkAlreadySent(
      [
        {
          status: "sent",
          notificationType: "dropped_off",
          body: "Daisy has been dropped off. Have a great day!",
        },
      ],
      ["tokenA"]
    ),
    false
  );
});

test("a different day's token does not count", () => {
  assert.equal(
    galleryLinkAlreadySent(
      [
        {
          status: "sent",
          notificationType: "hike_photos",
          body: "See the pics: https://packroute.app/p/otherDay",
        },
      ],
      ["tokenA"]
    ),
    false
  );
});

test("texts sent labels", () => {
  assert.equal(
    smsTypeLabel({ direction: "outbound", notificationType: "hike_photos", body: "" }),
    "Gallery"
  );
  assert.equal(
    smsTypeLabel({ direction: "outbound", notificationType: "dropped_off", body: "" }),
    "Drop-off"
  );
  assert.equal(
    smsTypeLabel({ direction: "outbound", notificationType: null, body: "Cooper has been picked up." }),
    "Pickup"
  );
  assert.equal(
    smsTypeLabel({ direction: "inbound", notificationType: null, body: "SKIP" }),
    "Reply"
  );
  assert.equal(smsStatusTone("sent"), "green");
  assert.equal(smsStatusTone("failed"), "red");
  assert.equal(smsStatusTone("pending"), "amber");
});

console.log("\nAll gallery SMS tests passed.");
