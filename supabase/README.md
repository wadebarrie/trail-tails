# Supabase — PackRoute

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Docker (for local Supabase stack)

## Apply migrations

### Local development

```bash
supabase start
supabase db reset   # applies all migrations + seed
```

### Remote (linked project)

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Prefer `supabase db push` over running SQL files manually so migration history stays consistent.

## Migration files

All timestamped SQL files live in `supabase/migrations/` (currently 30). They are applied in filename order. Highlights:

| File | Purpose |
|------|---------|
| `20250625120000_initial_schema.sql` | Enums, tables, indexes, triggers, auth helpers |
| `20250625120001_rls_policies.sql` | Row Level Security for admin + driver roles |
| `20250625120002_seed_dev.sql` | Sample company, customers, dogs, schedules |
| `20250710180000_platform_settings.sql` | Owner invite/signup toggle |
| `20250711120000_stripe_webhook_events.sql` | Stripe webhook idempotency |

List the full set with `ls supabase/migrations`.

## Creating staff users

Public signup should stay **disabled** in the Supabase Auth dashboard (defense in depth). Product invite gates are controlled separately in Owner → Settings (`platform_settings.invites_enabled`).

Create users via Supabase Dashboard or CLI with metadata:

```json
{
  "company_id": "a0000000-0000-0000-0000-000000000001",
  "role": "admin",
  "full_name": "Office Admin"
}
```

The `handle_new_user` trigger auto-creates a `profiles` row. Because that trigger trusts `user_metadata`, never enable open public signup in production.

## Route sort order

- **Default:** `dogs.route_sort_order` — set via admin drag-and-drop
- **Per day:** `stops.sort_order` — copied from dog at stop generation; overridable on today/tomorrow views
- Driver UI orders stops by `sort_order` ascending within pickup and dropoff lists
