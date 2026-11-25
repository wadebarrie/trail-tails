-- Stop signed-in users from escalating their own profile.
--
-- profiles_update_own and profiles_admin_update still decide which rows a
-- session may touch. This migration decides which columns:
--   * is_platform_owner, company_id — service role or migration superuser only
--   * role, can_drive, is_active — a same-company admin, and never their own row
--   * full_name, phone — anyone may edit their own row
--
-- handle_new_user reads company_id and role from raw_app_meta_data only.
-- GoTrue writes admin-supplied app_metadata in an UPDATE after the auth.users
-- INSERT, so provisioning also runs on that UPDATE. Re-running this file is safe.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_role public.user_role;
  drive boolean;
  company_text text;
  role_text text;
  company_uuid uuid;
BEGIN
  -- Later app_metadata edits (demo flags, provider list) must not rewrite
  -- an existing profile. Role changes go through profiles, not auth metadata.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  company_text := NULLIF(btrim(NEW.raw_app_meta_data ->> 'company_id'), '');
  role_text := NULLIF(btrim(NEW.raw_app_meta_data ->> 'role'), '');

  -- The auth.users INSERT only has provider metadata. The follow-up UPDATE
  -- carries company_id. Skip until that claim is present.
  IF company_text IS NULL THEN
    IF role_text IS NOT NULL THEN
      RAISE EXCEPTION 'app_metadata.company_id is required when app_metadata.role is set'
        USING ERRCODE = '23502';
    END IF;
    RETURN NEW;
  END IF;

  BEGIN
    company_uuid := company_text::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'app_metadata.company_id must be a uuid'
        USING ERRCODE = '22P02';
  END;

  IF role_text IS NULL THEN
    new_role := 'driver'::public.user_role;
  ELSE
    BEGIN
      new_role := role_text::public.user_role;
    EXCEPTION
      WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'app_metadata.role must be admin or driver'
          USING ERRCODE = '22P02';
    END;
  END IF;

  IF NEW.raw_app_meta_data ? 'can_drive' THEN
    BEGIN
      drive := COALESCE((NEW.raw_app_meta_data ->> 'can_drive')::boolean, false);
    EXCEPTION
      WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'app_metadata.can_drive must be a boolean'
          USING ERRCODE = '22P02';
    END;
  ELSE
    drive := new_role = 'admin'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, company_id, role, full_name, can_drive)
  VALUES (
    NEW.id,
    company_uuid,
    new_role,
    COALESCE(
      NULLIF(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      'New user'
    ),
    drive
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_app_metadata ON auth.users;
CREATE TRIGGER on_auth_user_app_metadata
  AFTER UPDATE OF raw_app_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.enforce_profile_column_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  privileged boolean;
BEGIN
  -- SECURITY INVOKER so current_user is the PostgREST role, not this
  -- function's owner. postgres / supabase_admin cover migrations and the
  -- SQL editor. authenticator + a service_role JWT covers a pooler that
  -- has not switched roles yet; an authenticated user cannot SET ROLE
  -- authenticator, so they cannot combine those two checks.
  privileged := current_user IN ('service_role', 'postgres', 'supabase_admin')
    OR (
      current_user = 'authenticator'
      AND coalesce(auth.role(), '') = 'service_role'
    );

  IF TG_OP = 'INSERT' THEN
    IF NOT privileged AND NEW.is_platform_owner THEN
      RAISE EXCEPTION 'only the service role can set is_platform_owner'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF privileged THEN
    RETURN NEW;
  END IF;

  IF NEW.is_platform_owner IS DISTINCT FROM OLD.is_platform_owner
     OR NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    RAISE EXCEPTION 'only the service role can change is_platform_owner or company_id'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.can_drive IS DISTINCT FROM OLD.can_drive
     OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    IF auth.uid() IS NOT NULL AND auth.uid() = OLD.id THEN
      RAISE EXCEPTION 'cannot change role, can_drive, or is_active on your own profile'
        USING ERRCODE = '42501';
    END IF;

    IF public.is_admin() IS NOT TRUE
       OR OLD.company_id IS DISTINCT FROM public.user_company_id() THEN
      RAISE EXCEPTION 'only a company admin can change role, can_drive, or is_active'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_profile_column_privileges() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_profile_column_privileges() FROM anon, authenticated;

DROP TRIGGER IF EXISTS profiles_enforce_column_privileges ON public.profiles;
CREATE TRIGGER profiles_enforce_column_privileges
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_column_privileges();

-- Table-level UPDATE covers every column, so revoke it and grant back only
-- the columns end users may send. The trigger above still rejects drivers
-- and self-edits of role, can_drive, and is_active. updated_at is filled by
-- profiles_set_updated_at and does not need a column grant.
REVOKE UPDATE ON TABLE public.profiles FROM PUBLIC;
REVOKE UPDATE ON TABLE public.profiles FROM anon, authenticated, authenticator;
GRANT UPDATE (full_name, phone, role, can_drive, is_active)
  ON TABLE public.profiles TO authenticated;
GRANT UPDATE ON TABLE public.profiles TO service_role;
