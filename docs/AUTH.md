# Creating staff users (Phase 5)

Staff sign in with email + password. Roles come from the `profiles` table, not the login page.

## 1. Create user in Supabase Auth

**Dashboard → Authentication → Users → Add user**

Or CLI:

```bash
npx supabase auth admin create-user \
  --project-ref wvriybvnsjfhlsnwkqrv \
  --email admin@example.com \
  --password 'YourSecurePassword' \
  --email-confirm
```

## 2. Set user metadata (required for profile trigger)

When creating via Dashboard, expand **User Metadata** and add:

```json
{
  "company_id": "a0000000-0000-0000-0000-000000000001",
  "role": "admin",
  "full_name": "Office Admin"
}
```

For drivers, use `"role": "driver"`.

The `handle_new_user` trigger creates the `profiles` row automatically.

## 3. If user already exists without a profile

Insert manually in SQL Editor:

```sql
INSERT INTO public.profiles (id, company_id, role, full_name)
VALUES (
  '<auth-user-uuid>',
  'a0000000-0000-0000-0000-000000000001',
  'admin',
  'Office Admin'
);
```

## 4. Sign in

- Admin → `/login?role=admin` → redirects to `/dashboard`
- Driver → `/login?role=driver` → redirects to `/today`

Role is enforced from `profiles.role`. A driver cannot access `/dashboard` and vice versa.
