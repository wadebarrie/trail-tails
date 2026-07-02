-- Each route is either a morning or afternoon route (create separate routes for twice-daily ops)

ALTER TABLE public.routes
  ADD COLUMN period public.hike_period NOT NULL DEFAULT 'morning';

COMMENT ON COLUMN public.routes.period IS
  'Whether this route is a morning or afternoon walk. Use separate routes when both run the same day.';

-- Drop afternoon hikes that shared a route under the old runs_afternoon model
DELETE FROM public.hikes h
WHERE h.period = 'afternoon'
  AND EXISTS (
    SELECT 1 FROM public.routes r
    WHERE r.id = h.route_id AND r.runs_afternoon = true
  );

UPDATE public.hikes h
SET period = r.period
FROM public.routes r
WHERE h.route_id = r.id;

UPDATE public.dog_day_assignments dda
SET period = r.period
FROM public.routes r
WHERE dda.route_id = r.id;

ALTER TABLE public.routes
  DROP COLUMN runs_afternoon,
  DROP COLUMN default_afternoon_driver_id;

ALTER TABLE public.dogs
  DROP COLUMN walk_period;

DROP TYPE public.dog_walk_period;

-- One hike per route per day
DELETE FROM public.hikes a
USING public.hikes b
WHERE a.company_id = b.company_id
  AND a.route_id = b.route_id
  AND a.date = b.date
  AND a.ctid > b.ctid;

ALTER TABLE public.hikes
  DROP CONSTRAINT IF EXISTS hikes_company_route_date_period_key;

ALTER TABLE public.hikes
  ADD CONSTRAINT hikes_company_route_date_key UNIQUE (company_id, route_id, date);
