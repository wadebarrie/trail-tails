-- Allow admin profiles to also access the driver mobile view.
ALTER TABLE public.profiles
  ADD COLUMN can_drive boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_active_driver()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_active = true
      AND (
        role = 'driver'::public.user_role
        OR (role = 'admin'::public.user_role AND can_drive = true)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, company_id, role, full_name, can_drive)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data ->> 'company_id')::uuid,
    COALESCE(
      (NEW.raw_user_meta_data ->> 'role')::public.user_role,
      'driver'::public.user_role
    ),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data ->> 'can_drive')::boolean, false)
  );
  RETURN NEW;
END;
$$;
