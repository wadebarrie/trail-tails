-- Fleet vehicles per company; assignable to routes (default) and hikes (day-of).

CREATE TABLE public.vehicles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  name       text NOT NULL,
  plate      text,
  capacity   integer,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vehicles_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT vehicles_capacity_positive CHECK (capacity IS NULL OR capacity > 0)
);

CREATE INDEX vehicles_company_active_idx
  ON public.vehicles (company_id, is_active);

CREATE TRIGGER vehicles_set_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY vehicles_admin_all ON public.vehicles
  FOR ALL
  USING (public.is_admin() AND company_id = public.user_company_id())
  WITH CHECK (public.is_admin() AND company_id = public.user_company_id());

CREATE POLICY vehicles_driver_select ON public.vehicles
  FOR SELECT
  USING (
    public.is_active_driver()
    AND company_id = public.user_company_id()
  );

COMMENT ON TABLE public.vehicles IS
  'Company fleet assets (vans/trucks). Assigned to routes by default and hikes per day.';

ALTER TABLE public.routes
  ADD COLUMN IF NOT EXISTS default_vehicle_id uuid
  REFERENCES public.vehicles (id) ON DELETE SET NULL;

CREATE INDEX routes_default_vehicle_idx ON public.routes (default_vehicle_id);

COMMENT ON COLUMN public.routes.default_vehicle_id IS
  'Default vehicle for this route; copied to hikes when unassigned';

ALTER TABLE public.hikes
  ADD COLUMN IF NOT EXISTS vehicle_id uuid
  REFERENCES public.vehicles (id) ON DELETE SET NULL;

CREATE INDEX hikes_vehicle_idx ON public.hikes (vehicle_id);

COMMENT ON COLUMN public.hikes.vehicle_id IS
  'Vehicle assigned for this hike/day — what the hiker sees on their run';
