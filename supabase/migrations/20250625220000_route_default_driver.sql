-- Default driver per route (shown on Routes tab; applied to new daily hikes)
ALTER TABLE public.routes
  ADD COLUMN IF NOT EXISTS default_driver_id uuid
  REFERENCES public.profiles (id) ON DELETE SET NULL;

CREATE INDEX routes_default_driver_idx ON public.routes (default_driver_id);

COMMENT ON COLUMN public.routes.default_driver_id IS 'Default hiker/driver for this route; copied to hikes when unassigned';
