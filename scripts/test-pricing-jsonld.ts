import {
  PRICING_CURRENCY,
  PRICING_TIERS,
  publicMonthlyPriceLabel,
} from "@/features/landing/pricing";
import {
  buildAdventureDogHikingSoftwarePageJsonLd,
  buildBarkBusAlternativePageJsonLd,
  buildDogWalkingSoftwarePageJsonLd,
  buildHomePageJsonLd,
  buildPricingPageJsonLd,
  buildTimeToPetAlternativePageJsonLd,
} from "@/features/landing/seo";

type JsonNode = Record<string, unknown>;

function walk(value: unknown, visit: (node: JsonNode) => void) {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
    return;
  }
  if (value && typeof value === "object") {
    const node = value as JsonNode;
    visit(node);
    for (const child of Object.values(node)) walk(child, visit);
  }
}

function offersIn(json: string): JsonNode[] {
  const found: JsonNode[] = [];
  walk(JSON.parse(json), (node) => {
    const type = node["@type"];
    if (type === "Offer" || type === "AggregateOffer") found.push(node);
  });
  return found;
}

const pages: { name: string; json: string }[] = [
  { name: "pricing", json: buildPricingPageJsonLd() },
  { name: "home", json: buildHomePageJsonLd() },
  { name: "time-to-pet-alternative", json: buildTimeToPetAlternativePageJsonLd() },
  { name: "dog-walking-software", json: buildDogWalkingSoftwarePageJsonLd() },
  { name: "adventure-dog-hiking-software", json: buildAdventureDogHikingSoftwarePageJsonLd() },
  { name: "barkbus-alternative", json: buildBarkBusAlternativePageJsonLd() },
];

let failed = false;
function assert(name: string, pass: boolean) {
  if (!pass) {
    console.error(`  ✗ ${name}`);
    failed = true;
  }
}

assert(
  "displayed labels come from the monthly amounts",
  PRICING_TIERS.every(
    (tier) => tier.priceLabel === publicMonthlyPriceLabel(tier.priceMonthly)
  ) &&
    PRICING_TIERS.map((tier) => tier.priceLabel).join(",") ===
      "CA$99/month,CA$179/month,CA$299/month"
);

const byName = new Map(PRICING_TIERS.map((tier) => [tier.name, tier.priceMonthly]));
const low = String(Math.min(...PRICING_TIERS.map((tier) => tier.priceMonthly)));
const high = String(Math.max(...PRICING_TIERS.map((tier) => tier.priceMonthly)));

for (const page of pages) {
  assert(`${page.name} structured data does not say USD`, !page.json.includes('"USD"'));
  const offers = offersIn(page.json);
  assert(`${page.name} publishes at least one offer`, offers.length > 0);
  for (const offer of offers) {
    assert(
      `${page.name} ${String(offer.name ?? offer["@type"])} is CAD`,
      offer.priceCurrency === PRICING_CURRENCY && offer.priceCurrency === "CAD"
    );
    if (offer["@type"] === "Offer") {
      assert(
        `${page.name} ${String(offer.name)} price matches the displayed tier`,
        byName.get(String(offer.name)) !== undefined &&
          offer.price === String(byName.get(String(offer.name)))
      );
    }
    if (offer["@type"] === "AggregateOffer") {
      assert(
        `${page.name} aggregate range matches the tiers`,
        offer.lowPrice === low && offer.highPrice === high
      );
    }
  }
}

const pricingOffers = offersIn(buildPricingPageJsonLd()).filter(
  (offer) => offer["@type"] === "Offer"
);
const threePlus = pricingOffers.find((offer) => offer.name === "Three+ drivers");
assert(
  "Three+ drivers structured price is CAD 299",
  threePlus?.price === "299" && threePlus.priceCurrency === "CAD"
);

if (failed) {
  console.error("Pricing JSON-LD tests failed.");
  process.exit(1);
}
console.log("All pricing JSON-LD tests passed.");
