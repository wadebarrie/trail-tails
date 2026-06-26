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

## Migration files

| File | Purpose |
|------|---------|
| `20250625120000_initial_schema.sql` | Enums, tables, indexes, triggers, auth helpers |
| `20250625120001_rls_policies.sql` | Row Level Security for admin + driver roles |
| `20250625120002_seed_dev.sql` | Sample company, customers, dogs, schedules |

## Creating staff users

Public signup is disabled. Create users via Supabase Dashboard or CLI with metadata:

```json
{
  "company_id": "a0000000-0000-0000-0000-000000000001",
  "role": "admin",
  "full_name": "Office Admin"
}
```

The `handle_new_user` trigger auto-creates a `profiles` row.

## Route sort order

- **Default:** `dogs.route_sort_order` — set via admin drag-and-drop
- **Per day:** `stops.sort_order` — copied from dog at stop generation; overridable on today/tomorrow views
- Driver UI orders stops by `sort_order` ascending within pickup and dropoff lists
