-- Dogs may be unassigned from a route (added via Routes page later)
ALTER TABLE public.dogs
  ALTER COLUMN route_id DROP NOT NULL;
