-- Company PackRoute cadence: once-per-day vs morning+afternoon.
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS route_cadence text NOT NULL DEFAULT 'twice'
  CHECK (route_cadence IN ('once', 'twice'));

COMMENT ON COLUMN public.companies.route_cadence IS
  'once = single PackRoute period per day (hide morning/afternoon UI); twice = morning and afternoon PackRoutes';

-- Prefer once for companies that only ever created morning (or only afternoon) routes.
UPDATE public.companies c
SET route_cadence = 'once'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.routes r
  WHERE r.company_id = c.id
    AND r.is_active = true
    AND r.period = 'afternoon'
)
AND EXISTS (
  SELECT 1
  FROM public.routes r
  WHERE r.company_id = c.id
    AND r.is_active = true
);
