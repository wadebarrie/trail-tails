-- Per-company night-before reminder send time (local timezone).

ALTER TABLE public.companies
  ADD COLUMN night_before_reminder_time time NOT NULL DEFAULT '19:30:00';

COMMENT ON COLUMN public.companies.night_before_reminder_time IS
  'Local time to send night-before pickup reminder texts for tomorrow''s hikes.';
