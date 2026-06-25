-- Trail Tails: Row Level Security policies
-- Phase 3 migration 2/3

-- ---------------------------------------------------------------------------
-- Enable RLS on all public tables
-- ---------------------------------------------------------------------------

ALTER TABLE public.companies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dog_schedule_days  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hikes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stops              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log          ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------

CREATE POLICY companies_select ON public.companies
  FOR SELECT
  USING (id = public.user_company_id());

CREATE POLICY companies_admin_update ON public.companies
  FOR UPDATE
  USING (public.is_admin() AND id = public.user_company_id())
  WITH CHECK (public.is_admin() AND id = public.user_company_id());

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT
  USING (id = auth.uid() OR (public.is_admin() AND company_id = public.user_company_id()));

CREATE POLICY profiles_admin_insert ON public.profiles
  FOR INSERT
  WITH CHECK (public.is_admin() AND company_id = public.user_company_id());

CREATE POLICY profiles_admin_update ON public.profiles
  FOR UPDATE
  USING (public.is_admin() AND company_id = public.user_company_id())
  WITH CHECK (public.is_admin() AND company_id = public.user_company_id());

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND company_id = public.user_company_id());

-- ---------------------------------------------------------------------------
-- customers — admin full access
-- ---------------------------------------------------------------------------

CREATE POLICY customers_admin_all ON public.customers
  FOR ALL
  USING (public.is_admin() AND company_id = public.user_company_id())
  WITH CHECK (public.is_admin() AND company_id = public.user_company_id());

CREATE POLICY customers_driver_select ON public.customers
  FOR SELECT
  USING (
    public.is_active_driver()
    AND company_id = public.user_company_id()
  );

-- ---------------------------------------------------------------------------
-- dogs — admin full; driver read-only (for stop display)
-- ---------------------------------------------------------------------------

CREATE POLICY dogs_admin_all ON public.dogs
  FOR ALL
  USING (public.is_admin() AND company_id = public.user_company_id())
  WITH CHECK (public.is_admin() AND company_id = public.user_company_id());

CREATE POLICY dogs_driver_select ON public.dogs
  FOR SELECT
  USING (
    public.is_active_driver()
    AND company_id = public.user_company_id()
  );

-- ---------------------------------------------------------------------------
-- dog_schedule_days — admin only
-- ---------------------------------------------------------------------------

CREATE POLICY dog_schedule_days_admin_all ON public.dog_schedule_days
  FOR ALL
  USING (
    public.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.dogs d
      WHERE d.id = dog_schedule_days.dog_id
        AND d.company_id = public.user_company_id()
    )
  )
  WITH CHECK (
    public.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.dogs d
      WHERE d.id = dog_schedule_days.dog_id
        AND d.company_id = public.user_company_id()
    )
  );

CREATE POLICY dog_schedule_days_driver_select ON public.dog_schedule_days
  FOR SELECT
  USING (
    public.is_active_driver()
    AND EXISTS (
      SELECT 1 FROM public.dogs d
      WHERE d.id = dog_schedule_days.dog_id
        AND d.company_id = public.user_company_id()
    )
  );

-- ---------------------------------------------------------------------------
-- schedule_exceptions — admin only
-- ---------------------------------------------------------------------------

CREATE POLICY schedule_exceptions_admin_all ON public.schedule_exceptions
  FOR ALL
  USING (
    public.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.dogs d
      WHERE d.id = schedule_exceptions.dog_id
        AND d.company_id = public.user_company_id()
    )
  )
  WITH CHECK (
    public.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.dogs d
      WHERE d.id = schedule_exceptions.dog_id
        AND d.company_id = public.user_company_id()
    )
  );

-- ---------------------------------------------------------------------------
-- hikes — admin full; driver read today/tomorrow
-- ---------------------------------------------------------------------------

CREATE POLICY hikes_admin_all ON public.hikes
  FOR ALL
  USING (public.is_admin() AND company_id = public.user_company_id())
  WITH CHECK (public.is_admin() AND company_id = public.user_company_id());

CREATE POLICY hikes_driver_select ON public.hikes
  FOR SELECT
  USING (
    public.is_active_driver()
    AND company_id = public.user_company_id()
    AND date >= public.company_today(company_id)
    AND date <= public.company_today(company_id) + 1
  );

CREATE POLICY hikes_driver_update ON public.hikes
  FOR UPDATE
  USING (
    public.is_active_driver()
    AND company_id = public.user_company_id()
    AND date >= public.company_today(company_id)
    AND date <= public.company_today(company_id) + 1
  )
  WITH CHECK (
    public.is_active_driver()
    AND company_id = public.user_company_id()
  );

-- ---------------------------------------------------------------------------
-- stops — admin full; driver read + update today/tomorrow
-- ---------------------------------------------------------------------------

CREATE POLICY stops_admin_all ON public.stops
  FOR ALL
  USING (
    public.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.hikes h
      WHERE h.id = stops.hike_id
        AND h.company_id = public.user_company_id()
    )
  )
  WITH CHECK (
    public.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.hikes h
      WHERE h.id = stops.hike_id
        AND h.company_id = public.user_company_id()
    )
  );

CREATE POLICY stops_driver_select ON public.stops
  FOR SELECT
  USING (
    public.is_active_driver()
    AND EXISTS (
      SELECT 1 FROM public.hikes h
      WHERE h.id = stops.hike_id
        AND h.company_id = public.user_company_id()
        AND h.date >= public.company_today(h.company_id)
        AND h.date <= public.company_today(h.company_id) + 1
    )
  );

CREATE POLICY stops_driver_update ON public.stops
  FOR UPDATE
  USING (
    public.is_active_driver()
    AND EXISTS (
      SELECT 1 FROM public.hikes h
      WHERE h.id = stops.hike_id
        AND h.company_id = public.user_company_id()
        AND h.date >= public.company_today(h.company_id)
        AND h.date <= public.company_today(h.company_id) + 1
    )
  )
  WITH CHECK (
    public.is_active_driver()
    AND EXISTS (
      SELECT 1 FROM public.hikes h
      WHERE h.id = stops.hike_id
        AND h.company_id = public.user_company_id()
    )
  );

-- ---------------------------------------------------------------------------
-- pending_requests — admin only
-- ---------------------------------------------------------------------------

CREATE POLICY pending_requests_admin_all ON public.pending_requests
  FOR ALL
  USING (public.is_admin() AND company_id = public.user_company_id())
  WITH CHECK (public.is_admin() AND company_id = public.user_company_id());

-- ---------------------------------------------------------------------------
-- sms_messages — admin read; inserts via service role (webhooks)
-- ---------------------------------------------------------------------------

CREATE POLICY sms_messages_admin_select ON public.sms_messages
  FOR SELECT
  USING (public.is_admin() AND company_id = public.user_company_id());

-- ---------------------------------------------------------------------------
-- notification_log — admin read
-- ---------------------------------------------------------------------------

CREATE POLICY notification_log_admin_select ON public.notification_log
  FOR SELECT
  USING (public.is_admin() AND company_id = public.user_company_id());

-- ---------------------------------------------------------------------------
-- audit_log — admin read
-- ---------------------------------------------------------------------------

CREATE POLICY audit_log_admin_select ON public.audit_log
  FOR SELECT
  USING (public.is_admin() AND company_id = public.user_company_id());
