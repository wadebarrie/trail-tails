-- As-needed dogs: schedule type on dogs + one-day route assignments

CREATE TYPE public.dog_schedule_type AS ENUM ('recurring', 'as_needed');

ALTER TABLE public.dogs
  ADD COLUMN schedule_type public.dog_schedule_type NOT NULL DEFAULT 'recurring';

COMMENT ON COLUMN public.dogs.schedule_type IS
  'recurring = auto-generates stops when assigned to a route; as_needed = manual day assignments only';

CREATE TABLE public.dog_day_assignments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  dog_id     uuid NOT NULL REFERENCES public.dogs (id) ON DELETE CASCADE,
  route_id   uuid NOT NULL REFERENCES public.routes (id) ON DELETE CASCADE,
  date       date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dog_id, date)
);

CREATE INDEX dog_day_assignments_route_date_idx
  ON public.dog_day_assignments (route_id, date);

ALTER TABLE public.dog_day_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY dog_day_assignments_admin_all ON public.dog_day_assignments
  FOR ALL
  USING (public.is_admin() AND company_id = public.user_company_id())
  WITH CHECK (public.is_admin() AND company_id = public.user_company_id());

CREATE POLICY dog_day_assignments_driver_select ON public.dog_day_assignments
  FOR SELECT
  USING (
    public.is_active_driver()
    AND company_id = public.user_company_id()
  );
