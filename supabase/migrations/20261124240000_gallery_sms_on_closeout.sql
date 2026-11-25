-- Gallery SMS on hike close-out: company toggle + notification type.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS auto_send_gallery_on_closeout boolean NOT NULL DEFAULT true;

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'hike_photos';
