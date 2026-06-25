# Trail Tails

Operations platform for dog hiking companies — schedules, SMS updates, and a simple driver mobile workflow.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS
- **Supabase** (Postgres, Auth, RLS)
- **Netlify** (hosting)
- Twilio + Google Maps (Phases 8–9)

## Quick start

```bash
cp .env.example .env.local
# Fill in Supabase keys, then:
bash scripts/sync-env.sh

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply Supabase migrations + seed |
| `npm run db:sync-env` | Fix DATABASE_URL encoding in `.env.local` |

## Project structure

```
src/
├── app/
│   ├── (admin)/       # Office dashboard
│   ├── (auth)/        # Login
│   ├── (driver)/      # Driver mobile UI
│   └── api/           # Route handlers
├── features/          # Feature modules (customers, dogs, sms, …)
├── lib/               # Supabase, Twilio, Google Maps, validation
└── types/             # Shared TypeScript types
docs/                  # Architecture + database design
supabase/migrations/   # SQL migrations
```

## Environment variables

See [`.env.example`](.env.example). Required for the app:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY` (server/webhooks — run `bash scripts/fetch-supabase-keys.sh` after `npx supabase login`)

## Deployment (Netlify)

1. Connect GitHub repo to Netlify
2. Add env vars from `.env.local` (except `DATABASE_URL` unless needed for scripts)
3. Build command: `npm run build` (configured in `netlify.toml`)

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Database design](docs/DATABASE.md)
- [Supabase setup](supabase/README.md)

## Phase status

| Phase | Status |
|-------|--------|
| 1–3 Architecture, DB, migrations | ✅ |
| 4 Next.js scaffold | ✅ |
| 5 Authentication | ✅ |
| 6 Admin dashboard | ✅ |
| 7 Driver interface | ✅ |
| 8 Twilio integration | Next |
