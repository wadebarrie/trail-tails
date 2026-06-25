-- Driver flow: scheduled → en_route → arrived → picked_up | dropped_off

ALTER TYPE public.stop_status ADD VALUE IF NOT EXISTS 'arrived' AFTER 'en_route';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'arrived' AFTER 'en_route';

ALTER TABLE public.stops
  ADD COLUMN IF NOT EXISTS arrived_at timestamptz;
