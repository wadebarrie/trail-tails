# Stripe live setup (production / Netlify)

Use **Live mode** in the Stripe Dashboard (toggle in the top-right). Fill values into `.env.local` under the Netlify production block, then paste the same keys into **Netlify → packroute → Environment variables → Production**.

Local `.env.local` keeps **test** keys active so local Checkout still works until cleanup.

## 1. API keys

Dashboard → **Developers → API keys** (Live):

| Env var | Where |
|---------|--------|
| `STRIPE_SECRET_KEY` | Secret key `sk_live_…` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key `pk_live_…` (optional today; set for future Stripe.js) |

## 2. Products & Prices

Create three products (or one product with three prices). Currency **USD**, recurring.

| Tier | Env var (monthly) | Amount | Env var (yearly, optional) | Amount |
|------|-------------------|--------|----------------------------|--------|
| One hiker | `STRIPE_PRICE_ONE_HIKER` | $29 / month | `STRIPE_PRICE_ONE_HIKER_YEARLY` | $290 / year |
| Two hikers | `STRIPE_PRICE_TWO_HIKERS` | $49 / month | `STRIPE_PRICE_TWO_HIKERS_YEARLY` | $490 / year |
| Three+ hikers | `STRIPE_PRICE_THREE_PLUS` | $79 / month | `STRIPE_PRICE_THREE_PLUS_YEARLY` | $790 / year |

Yearly = **10× monthly** (pay for 10 months, get 12). Copy each Price ID (`price_…`) into the matching env var.

Suggested product names: `PackRoute — One hiker`, `PackRoute — Two hikers`, `PackRoute — Three+ hikers`.

## 3. Webhook

Dashboard → **Developers → Webhooks → Add endpoint** (Live):

- **URL:** `https://packroute.app/api/webhooks/stripe`
- **Events:**
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`

Copy the endpoint **Signing secret** (`whsec_…`) → `STRIPE_WEBHOOK_SECRET`.

## 4. Customer Portal

Dashboard → **Settings → Billing → Customer portal** → enable (so “Manage billing” works after Checkout).

## 5. Netlify env checklist (Production context)

Also confirm production site URL:

```text
NEXT_PUBLIC_APP_URL=https://packroute.app
```

Stripe:

```text
STRIPE_SECRET_KEY=sk_live_…
STRIPE_WEBHOOK_SECRET=whsec_…
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_…
STRIPE_PRICE_ONE_HIKER=price_…
STRIPE_PRICE_TWO_HIKERS=price_…
STRIPE_PRICE_THREE_PLUS=price_…
STRIPE_PRICE_ONE_HIKER_YEARLY=price_…   # optional
STRIPE_PRICE_TWO_HIKERS_YEARLY=price_…  # optional
STRIPE_PRICE_THREE_PLUS_YEARLY=price_…  # optional
```

Redeploy after saving env vars.

## 6. Smoke test

1. Sign in as a trial admin on production.
2. Settings → Billing → choose a tier → Checkout with a real card (or Stripe test? — Live needs a real card; use a $0 coupon / small refund plan if needed).
3. Confirm webhook deliveries succeed in Stripe Dashboard.
4. Subscription status becomes `active` in the app; Manage billing opens the portal.
