-- Company admins should be able to drive with the same login (no second email).
-- New admin signups set can_drive via user_metadata; backfill existing admins.

UPDATE public.profiles
SET can_drive = true
WHERE role = 'admin'::public.user_role
  AND can_drive = false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_role public.user_role;
  drive boolean;
BEGIN
  new_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::public.user_role,
    'driver'::public.user_role
  );

  -- Explicit metadata wins; otherwise company admins can drive by default.
  IF NEW.raw_user_meta_data ? 'can_drive' THEN
    drive := COALESCE((NEW.raw_user_meta_data ->> 'can_drive')::boolean, false);
  ELSE
    drive := (new_role = 'admin'::public.user_role);
  END IF;

  INSERT INTO public.profiles (id, company_id, role, full_name, can_drive)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data ->> 'company_id')::uuid,
    new_role,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    drive
  );
  RETURN NEW;
END;
$$;
