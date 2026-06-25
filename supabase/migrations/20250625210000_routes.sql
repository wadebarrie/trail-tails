-- Phase D (partial): multi-route — one hike per route per day
-- Seed 4 routes for Trail Tails Hiking

CREATE TABLE public.routes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES public.companies (id) ON DELETE RESTRICT,
  name        text        NOT NULL,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);

CREATE INDEX routes_company_order_idx ON public.routes (company_id, sort_order);

CREATE TRIGGER routes_set_updated_at
  BEFORE UPDATE ON public.routes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.dogs
  ADD COLUMN IF NOT EXISTS route_id uuid REFERENCES public.routes (id) ON DELETE RESTRICT;

ALTER TABLE public.hikes
  ADD COLUMN IF NOT EXISTS route_id uuid REFERENCES public.routes (id) ON DELETE RESTRICT;

INSERT INTO public.routes (id, company_id, name, sort_order) VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Vancouver',
    0
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Burnaby New Westminster Coquitlam',
    1
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Surrey Delta',
    2
  ),
  (
    'd0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'Langley Abbotsford',
    3
  )
ON CONFLICT (company_id, name) DO NOTHING;

-- Backfill existing dogs and hikes to Vancouver route
UPDATE public.dogs
SET route_id = 'd0000000-0000-0000-0000-000000000001'
WHERE route_id IS NULL
  AND company_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.hikes
SET route_id = 'd0000000-0000-0000-0000-000000000001'
WHERE route_id IS NULL
  AND company_id = 'a0000000-0000-0000-0000-000000000001';

ALTER TABLE public.dogs
  ALTER COLUMN route_id SET NOT NULL;

ALTER TABLE public.hikes
  ALTER COLUMN route_id SET NOT NULL;

ALTER TABLE public.hikes
  DROP CONSTRAINT IF EXISTS hikes_company_id_date_key;

ALTER TABLE public.hikes
  ADD CONSTRAINT hikes_company_route_date_key UNIQUE (company_id, route_id, date);

CREATE INDEX hikes_route_date_idx ON public.hikes (route_id, date);
CREATE INDEX dogs_route_order_idx ON public.dogs (route_id, route_sort_order);

-- RLS
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY routes_admin_all ON public.routes
  FOR ALL
  USING (public.is_admin() AND company_id = public.user_company_id())
  WITH CHECK (public.is_admin() AND company_id = public.user_company_id());

CREATE POLICY routes_driver_select ON public.routes
  FOR SELECT
  USING (company_id = public.user_company_id());
