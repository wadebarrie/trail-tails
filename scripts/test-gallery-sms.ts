import assert from "node:assert/strict";
import {
  buildHikeGalleryMessage,
  bulkCloseOutConfirmBody,
  galleryLinkAlreadySent,
  ABANDONED_GALLERY_CLAIM_MS,
  galleryClaimCanRetry,
  gallerySendBudgetExceeded,
  galleryTokenLikePattern,
  galleryWhenLabel,
  SINGLE_GALLERY_SMS_BUDGET_MS,
} from "../src/features/hike-photos/gallery-sms-rules";
import {
  imageSizeFromHeader,
  saneImageDimensions,
} from "../src/features/hike-photos/compress-image";
import {
  fetchFailureOutcome,
  outboundBodyMatches,
  smsAbortTimeoutMs,
  twilioMessageIsAccepted,
  twilioMessageIsFailed,
} from "../src/lib/twilio/outcome";
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

test("single close-out text wait stays well under the function limit", () => {
  assert.ok(SINGLE_GALLERY_SMS_BUDGET_MS <= 8_000);
  assert.ok(SINGLE_GALLERY_SMS_BUDGET_MS >= 3_000);
});

test("jpeg header size does not upscale and finds the frame", () => {
  const bytes = new Uint8Array(32);
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  bytes[3] = 0xc0;
  bytes[4] = 0x00;
  bytes[5] = 0x11;
  bytes[7] = 0x0f;
  bytes[8] = 0xa0;
  bytes[9] = 0x12;
  bytes[10] = 0xc0;
  assert.deepEqual(imageSizeFromHeader(bytes), { width: 4800, height: 4000 });
  assert.equal(imageSizeFromHeader(new Uint8Array([1, 2, 3])), null);
});

test("only a failed gallery claim can be retried immediately", () => {
  assert.equal(galleryClaimCanRetry("failed", 0), true);
  assert.equal(galleryClaimCanRetry("pending", 60_000), false);
  assert.equal(galleryClaimCanRetry("sent", ABANDONED_GALLERY_CLAIM_MS), false);
  assert.equal(
    galleryClaimCanRetry("pending", ABANDONED_GALLERY_CLAIM_MS),
    true
  );
});

test("gallery texts abort; driver texts do not", () => {
  assert.equal(smsAbortTimeoutMs("hike_photos"), 8_000);
  assert.equal(smsAbortTimeoutMs("dropped_off"), null);
  assert.equal(smsAbortTimeoutMs("en_route"), null);
  assert.equal(fetchFailureOutcome("TimeoutError"), "unknown");
  assert.equal(fetchFailureOutcome("AbortError"), "unknown");
  assert.equal(fetchFailureOutcome("Error"), "failed");
});

test("a test-redirect prefix still matches the logged text", () => {
  const logged = "Daisy had a great hike today! See the pics: https://packroute.app/p/abc";
  assert.equal(outboundBodyMatches(`[Rachel] ${logged}`, logged), true);
  assert.equal(outboundBodyMatches("a different text", logged), false);
  assert.equal(twilioMessageIsAccepted("queued"), true);
  assert.equal(twilioMessageIsAccepted("delivered"), true);
  assert.equal(twilioMessageIsFailed("undelivered"), true);
  assert.equal(twilioMessageIsFailed("sent"), false);
});

test("implausible image headers are ignored", () => {
  assert.equal(saneImageDimensions({ width: 1, height: 1 }), null);
  assert.equal(saneImageDimensions({ width: 100_000, height: 4000 }), null);
  assert.equal(saneImageDimensions({ width: 4000, height: 20 }), null);
  assert.deepEqual(saneImageDimensions({ width: 4000, height: 3000 }), {
    width: 4000,
    height: 3000,
  });
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
