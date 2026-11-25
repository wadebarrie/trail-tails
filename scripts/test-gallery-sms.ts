import assert from "node:assert/strict";
import {
  buildHikeGalleryMessage,
  bulkCloseOutConfirmBody,
  galleryLinkAlreadySent,
  gallerySendBudgetExceeded,
  galleryTokenLikePattern,
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

test("underscore in a share token is not a LIKE wildcard", () => {
  assert.equal(galleryTokenLikePattern("ab_cd"), "%/p/ab\\_cd%");
  assert.equal(galleryTokenLikePattern("100%"), "%/p/100\\%%");
  assert.notEqual(galleryTokenLikePattern("ab_cd"), "%/p/ab_cd%");
});

test("bulk gallery budget is one deadline, not per hike", () => {
  assert.equal(gallerySendBudgetExceeded(1_000, 1_000), true);
  assert.equal(gallerySendBudgetExceeded(999, 1_000), false);
  assert.equal(gallerySendBudgetExceeded(5_000, undefined), false);
});

test("bulk close-out warning cannot be undone and names the text count", () => {
  const body = bulkCloseOutConfirmBody({
    routeCount: 284,
    galleryTextsOn: true,
    galleryRecipientCount: 12,
  });
  assert.match(body, /cannot be undone/i);
  assert.match(body, /284 incomplete routes/);
  assert.match(body, /up to 12 owners/);
  const off = bulkCloseOutConfirmBody({
    routeCount: 2,
    galleryTextsOn: false,
    galleryRecipientCount: 4,
  });
  assert.match(off, /no owners will be texted/i);
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
