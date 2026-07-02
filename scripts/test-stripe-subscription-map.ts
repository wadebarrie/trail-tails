import { mapStripeSubscriptionStatus } from "@/features/subscription/stripe-map";

type Case = { name: string; pass: boolean };

function assert(name: string, condition: boolean): Case {
  return { name, pass: condition };
}

const cases: Case[] = [
  assert("trialing → trial", mapStripeSubscriptionStatus("trialing") === "trial"),
  assert("active → active", mapStripeSubscriptionStatus("active") === "active"),
  assert("past_due → past_due", mapStripeSubscriptionStatus("past_due") === "past_due"),
  assert("unpaid → past_due", mapStripeSubscriptionStatus("unpaid") === "past_due"),
  assert("canceled → cancelled", mapStripeSubscriptionStatus("canceled") === "cancelled"),
  assert("paused → paused", mapStripeSubscriptionStatus("paused") === "paused"),
  assert(
    "incomplete → inactive",
    mapStripeSubscriptionStatus("incomplete") === "inactive"
  ),
  assert(
    "unknown → inactive",
    mapStripeSubscriptionStatus("something_else") === "inactive"
  ),
];

const failed = cases.filter((c) => !c.pass);

if (failed.length > 0) {
  console.error("Stripe subscription map tests failed:");
  for (const c of failed) console.error(`  ✗ ${c.name}`);
  process.exit(1);
}

console.log(`All ${cases.length} Stripe subscription map tests passed.`);
