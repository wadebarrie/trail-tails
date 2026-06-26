# PackRoute — test login credentials

Dev/test accounts only. Shared password for all users below.

**Password:** `TrailTailsDev1!`

---

## Where to sign in

| Environment | URL |
|-------------|-----|
| Production | https://packroute.netlify.app/login |
| Local | http://localhost:3000/login |

**Shortcuts**

- Admin: `/login?role=admin` → `/dashboard`
- Driver: `/login?role=driver` → `/today`

---

## Admin

| Email | Name | Notes |
|-------|------|-------|
| `admin@trailtails.test` | Test Admin | Full admin access; `can_drive` enabled (can use driver views too) |

---

## Drivers (one per route)

| Route | Driver | Email |
|-------|--------|-------|
| Vancouver | Alex Chen | `driver-vancouver@trailtails.test` |
| New Westminster Burnaby | Sam Patel | `driver-burnaby@trailtails.test` |
| Surrey Delta | Jordan Lee | `driver-surrey@trailtails.test` |
| Langley Abbotsford | Riley Morgan | `driver-langley@trailtails.test` |

---

## Legacy test driver

| Email | Name | Notes |
|-------|------|-------|
| `driver@trailtails.test` | Test Driver (legacy) | Driver role; not assigned as a route default driver |

---

## Recreate or sync users

If accounts are missing or route drivers need re-linking:

```bash
node scripts/seed-test-users.mjs
```

Requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

---

## SMS / customer testing

| Purpose | Detail |
|---------|--------|
| Inbound SMS (Wade test customer) | Phone `+16046792422` → customer **Wade Barrie** (Vancouver / Rawley) |
| Simulated inbound | `npm run test:inbound-sms -- --from "+16046792422" "SKIP TOMORROW"` |
| Outbound SMS redirect (pilot) | Set `TWILIO_SMS_REDIRECT_TO=+16046792422` in Netlify / `.env.local` |

---

## Company ID (metadata / SQL)

`a0000000-0000-0000-0000-000000000001` — PackRoute
