-- Backfill hike driver_id from route default where missing
UPDATE public.hikes h
SET driver_id = r.default_driver_id
FROM public.routes r
WHERE h.route_id = r.id
  AND h.driver_id IS NULL
  AND r.default_driver_id IS NOT NULL;
