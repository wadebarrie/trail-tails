import { logWarn } from "@/lib/logger";
import { perfAsync } from "@/lib/perf";
import { constructStripeEvent, getStripeConfig } from "@/lib/stripe";
import { syncSubscriptionFromStripeEvent } from "@/features/subscription/process-stripe-webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const config = getStripeConfig();
  if (!config) {
    logWarn("webhook", "Stripe webhook hit but Stripe is not configured");
    return new Response("Stripe not configured", { status: 503 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logWarn("webhook", "Stripe webhook skipped — SUPABASE_SERVICE_ROLE_KEY missing");
    return new Response("Server misconfigured", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const payload = await request.text();

  let event;
  try {
    event = constructStripeEvent(payload, signature, config);
  } catch {
    logWarn("webhook", "Stripe webhook rejected — invalid signature");
    return new Response("Invalid signature", { status: 400 });
  }

  return perfAsync(`api webhook/stripe ${event.type}`, async () => {
    const result = await syncSubscriptionFromStripeEvent(event);

    if (!result.ok) {
      logWarn("webhook", `Stripe webhook ${event.type} failed: ${result.error}`);
      return new Response(result.error, { status: 422 });
    }

    return Response.json({ received: true, action: result.action });
  });
}
