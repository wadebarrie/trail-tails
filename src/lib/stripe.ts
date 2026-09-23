import Stripe from "stripe";

export type StripeConfig = {
  secretKey: string;
  webhookSecret: string;
};

/** Secret key only — enough for Checkout / Customer Portal. */
export function getStripeSecretKey(): string | null {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

export function getStripeConfig(): StripeConfig | null {
  const secretKey = getStripeSecretKey();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!secretKey || !webhookSecret) return null;

  return { secretKey, webhookSecret };
}

export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
  });
}

export function constructStripeEvent(
  payload: string,
  signature: string,
  config: StripeConfig
): Stripe.Event {
  const stripe = createStripeClient(config.secretKey);
  return stripe.webhooks.constructEvent(payload, signature, config.webhookSecret);
}
