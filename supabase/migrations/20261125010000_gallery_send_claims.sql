-- One gallery text per owner per hike date (#128).
-- Idempotent: safe to re-run. Apply on production before or with the app deploy
-- that reads this table. Until it exists, gallery texts still send, but two
-- close-outs at once can both pass the old "already sent" check.

CREATE TABLE IF NOT EXISTS public.hike_photo_gallery_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  hike_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  CONSTRAINT hike_photo_gallery_sends_status_check
    CHECK (status IN ('pending', 'sent', 'failed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS hike_photo_gallery_sends_owner_day_idx
  ON public.hike_photo_gallery_sends (company_id, customer_id, hike_date);

ALTER TABLE public.hike_photo_gallery_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hike_photo_gallery_sends_admin_select
  ON public.hike_photo_gallery_sends;

CREATE POLICY hike_photo_gallery_sends_admin_select
  ON public.hike_photo_gallery_sends
  FOR SELECT
  USING (public.is_admin() AND company_id = public.user_company_id());
