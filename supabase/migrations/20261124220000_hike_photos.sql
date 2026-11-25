-- Hike photo uploads v1 (#113): driver uploads, dog tags, per-owner signed gallery links.

CREATE TABLE public.hike_photos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  hike_id      uuid NOT NULL REFERENCES public.hikes(id) ON DELETE CASCADE,
  uploaded_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  storage_path text NOT NULL UNIQUE,
  caption      text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX hike_photos_company_created_idx
  ON public.hike_photos (company_id, created_at DESC);
CREATE INDEX hike_photos_hike_idx ON public.hike_photos (hike_id);

CREATE TABLE public.hike_photo_dogs (
  photo_id uuid NOT NULL REFERENCES public.hike_photos(id) ON DELETE CASCADE,
  dog_id   uuid NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  PRIMARY KEY (photo_id, dog_id)
);

CREATE INDEX hike_photo_dogs_dog_idx ON public.hike_photo_dogs (dog_id);

-- One unguessable gallery link per (hike, customer). Public access goes through
-- the service role in /p/[token]; there is intentionally no anon policy.
CREATE TABLE public.hike_photo_shares (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  hike_id     uuid NOT NULL REFERENCES public.hikes(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  token       text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hike_photo_shares_hike_customer_key UNIQUE (hike_id, customer_id)
);

CREATE INDEX hike_photo_shares_company_idx ON public.hike_photo_shares (company_id);

ALTER TABLE public.hike_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hike_photo_dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hike_photo_shares ENABLE ROW LEVEL SECURITY;

-- hike_photos: admin full; driver read + insert own uploads in their company
CREATE POLICY hike_photos_admin_all ON public.hike_photos
  FOR ALL
  USING (public.is_admin() AND company_id = public.user_company_id())
  WITH CHECK (public.is_admin() AND company_id = public.user_company_id());

CREATE POLICY hike_photos_driver_select ON public.hike_photos
  FOR SELECT
  USING (public.is_active_driver() AND company_id = public.user_company_id());

CREATE POLICY hike_photos_driver_insert ON public.hike_photos
  FOR INSERT
  WITH CHECK (
    public.is_active_driver()
    AND company_id = public.user_company_id()
    AND uploaded_by = auth.uid()
  );

-- hike_photo_dogs: follows the parent photo
CREATE POLICY hike_photo_dogs_admin_all ON public.hike_photo_dogs
  FOR ALL
  USING (
    public.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.hike_photos p
      WHERE p.id = hike_photo_dogs.photo_id
        AND p.company_id = public.user_company_id()
    )
  )
  WITH CHECK (
    public.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.hike_photos p
      WHERE p.id = hike_photo_dogs.photo_id
        AND p.company_id = public.user_company_id()
    )
  );

CREATE POLICY hike_photo_dogs_driver_select ON public.hike_photo_dogs
  FOR SELECT
  USING (
    public.is_active_driver()
    AND EXISTS (
      SELECT 1 FROM public.hike_photos p
      WHERE p.id = hike_photo_dogs.photo_id
        AND p.company_id = public.user_company_id()
    )
  );

CREATE POLICY hike_photo_dogs_driver_insert ON public.hike_photo_dogs
  FOR INSERT
  WITH CHECK (
    public.is_active_driver()
    AND EXISTS (
      SELECT 1 FROM public.hike_photos p
      WHERE p.id = hike_photo_dogs.photo_id
        AND p.company_id = public.user_company_id()
        AND p.uploaded_by = auth.uid()
    )
  );

-- hike_photo_shares: admin full; drivers read (tokens are minted server-side)
CREATE POLICY hike_photo_shares_admin_all ON public.hike_photo_shares
  FOR ALL
  USING (public.is_admin() AND company_id = public.user_company_id())
  WITH CHECK (public.is_admin() AND company_id = public.user_company_id());

CREATE POLICY hike_photo_shares_driver_select ON public.hike_photo_shares
  FOR SELECT
  USING (public.is_active_driver() AND company_id = public.user_company_id());

-- ---------------------------------------------------------------------------
-- Storage: private bucket; objects live at {company_id}/{hike_id}/{uuid}.jpg
-- Gallery pages mint short-lived signed URLs with the service role.
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hike-photos',
  'hike-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS hike_photos_storage_select ON storage.objects;
DROP POLICY IF EXISTS hike_photos_storage_insert ON storage.objects;
DROP POLICY IF EXISTS hike_photos_storage_delete ON storage.objects;

CREATE POLICY hike_photos_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'hike-photos'
    AND (public.is_admin() OR public.is_active_driver())
    AND (storage.foldername(name))[1] = public.user_company_id()::text
  );

CREATE POLICY hike_photos_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'hike-photos'
    AND (public.is_admin() OR public.is_active_driver())
    AND (storage.foldername(name))[1] = public.user_company_id()::text
  );

CREATE POLICY hike_photos_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'hike-photos'
    AND public.is_admin()
    AND (storage.foldername(name))[1] = public.user_company_id()::text
  );
