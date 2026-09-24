#!/usr/bin/env node
/**
 * Create PackRoute Stripe Prices for the margin-safe grid and print env updates.
 *
 * Usage (test mode — default from .env.local):
 *   node --env-file=.env.local scripts/create-stripe-prices.mjs
 *
 * Live mode (use a full sk_live_ key, not rk_live_):
 *   STRIPE_SECRET_KEY=sk_live_… node scripts/create-stripe-prices.mjs
 *
 * Stripe Prices are immutable — this creates new Prices on existing Products
 * (or creates Products if missing). Archive old Prices in the Dashboard if desired.
 */

const TIERS = [
  {
    name: "PackRoute — One hiker",
    lookup: "packroute_one_hiker",
    monthly: 9900,
    yearly: 99000,
    envMonthly: "STRIPE_PRICE_ONE_HIKER",
    envYearly: "STRIPE_PRICE_ONE_HIKER_YEARLY",
    dogs: "Up to 20 active dogs a week",
  },
  {
    name: "PackRoute — Two hikers",
    lookup: "packroute_two_hikers",
    monthly: 17900,
    yearly: 179000,
    envMonthly: "STRIPE_PRICE_TWO_HIKERS",
    envYearly: "STRIPE_PRICE_TWO_HIKERS_YEARLY",
    dogs: "Up to 40 active dogs a week",
  },
  {
    name: "PackRoute — Three+ hikers",
    lookup: "packroute_three_plus",
    monthly: 29900,
    yearly: 299000,
    envMonthly: "STRIPE_PRICE_THREE_PLUS",
    envYearly: "STRIPE_PRICE_THREE_PLUS_YEARLY",
    dogs: "Up to 70 active dogs a week",
  },
];

async function stripe(path, { method = "GET", form } = {}) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  const body = form ? new URLSearchParams(form) : undefined;
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(body
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : {}),
    },
    body,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      `${method} ${path}: ${json?.error?.message || res.statusText}`
    );
  }
  return json;
}

async function findOrCreateProduct(tier) {
  const search = await stripe(
    `/products/search?query=${encodeURIComponent(`name~'${tier.name}'`)}`
  );
  const existing = search.data?.[0];
  if (existing) {
    console.log(`Product exists: ${existing.id} (${existing.name})`);
    await stripe(`/products/${existing.id}`, {
      method: "POST",
      form: {
        name: tier.name,
        "metadata[dogs]": tier.dogs,
        "metadata[lookup]": tier.lookup,
      },
    });
    return existing.id;
  }

  const created = await stripe("/products", {
    method: "POST",
    form: {
      name: tier.name,
      "metadata[dogs]": tier.dogs,
      "metadata[lookup]": tier.lookup,
    },
  });
  console.log(`Product created: ${created.id} (${created.name})`);
  return created.id;
}

async function createPrice(productId, unitAmount, interval) {
  return stripe("/prices", {
    method: "POST",
    form: {
      product: productId,
      currency: "usd",
      unit_amount: String(unitAmount),
      "recurring[interval]": interval,
    },
  });
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY || "";
  const mode = key.startsWith("sk_live")
    ? "LIVE"
    : key.startsWith("rk_live")
      ? "LIVE_RESTRICTED"
      : key.startsWith("sk_test")
        ? "TEST"
        : "UNKNOWN";

  if (mode === "LIVE_RESTRICTED") {
    throw new Error(
      "rk_live_ keys often cannot create Products/Prices. Use a full sk_live_ secret key."
    );
  }

  console.log(`Stripe mode: ${mode}\n`);

  const envLines = [];

  for (const tier of TIERS) {
    const productId = await findOrCreateProduct(tier);
    const monthly = await createPrice(productId, tier.monthly, "month");
    const yearly = await createPrice(productId, tier.yearly, "year");
    console.log(
      `  monthly $${tier.monthly / 100} → ${monthly.id}\n  yearly  $${tier.yearly / 100} → ${yearly.id}\n`
    );
    envLines.push(`${tier.envMonthly}=${monthly.id}`);
    envLines.push(`${tier.envYearly}=${yearly.id}`);
  }

  console.log("=== Paste into .env.local / Netlify Production ===");
  console.log(envLines.join("\n"));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
