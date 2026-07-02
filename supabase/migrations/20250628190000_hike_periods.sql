-- Morning and afternoon hikes per route per day

CREATE TYPE public.hike_period AS ENUM ('morning', 'afternoon');
CREATE TYPE public.dog_walk_period AS ENUM ('morning', 'afternoon', 'both');

ALTER TABLE public.routes
  ADD COLUMN runs_afternoon boolean NOT NULL DEFAULT false,
  ADD COLUMN default_afternoon_driver_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.routes.runs_afternoon IS
  'When true, the route runs a second hike in the afternoon (separate driver optional).';

ALTER TABLE public.hikes
  ADD COLUMN period public.hike_period NOT NULL DEFAULT 'morning';

ALTER TABLE public.hikes
  DROP CONSTRAINT IF EXISTS hikes_company_route_date_key;

ALTER TABLE public.hikes
  ADD CONSTRAINT hikes_company_route_date_period_key
  UNIQUE (company_id, route_id, date, period);

ALTER TABLE public.dogs
  ADD COLUMN walk_period public.dog_walk_period NOT NULL DEFAULT 'morning';

COMMENT ON COLUMN public.dogs.walk_period IS
  'Which walk(s) per day this recurring dog is on. As-needed dogs use assignment period.';

ALTER TABLE public.dog_day_assignments
  ADD COLUMN period public.hike_period NOT NULL DEFAULT 'morning';

ALTER TABLE public.dog_day_assignments
  DROP CONSTRAINT dog_day_assignments_dog_id_date_key;

ALTER TABLE public.dog_day_assignments
  ADD CONSTRAINT dog_day_assignments_dog_date_period_key
  UNIQUE (dog_id, date, period);
