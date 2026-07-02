-- Optional drop-off windows on dogs; drop-off stops may have no planned window.

ALTER TABLE public.dogs
  ADD COLUMN dropoff_window_start time,
  ADD COLUMN dropoff_window_end time;

COMMENT ON COLUMN public.dogs.dropoff_window_start IS
  'Optional default drop-off window; null means no planned afternoon window.';

ALTER TABLE public.stops
  ALTER COLUMN window_start DROP NOT NULL,
  ALTER COLUMN window_end DROP NOT NULL;

-- Drop-off stops use pickup windows today; clear so default is no afternoon window.
UPDATE public.stops
SET window_start = NULL, window_end = NULL
WHERE stop_type = 'dropoff';
