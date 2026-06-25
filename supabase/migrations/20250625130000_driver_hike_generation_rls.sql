-- Allow drivers to materialize today/tomorrow hikes and stops (same as admin dashboard flow).

CREATE POLICY hikes_driver_insert ON public.hikes
  FOR INSERT
  WITH CHECK (
    public.is_active_driver()
    AND company_id = public.user_company_id()
    AND date >= public.company_today(company_id)
    AND date <= public.company_today(company_id) + 1
  );

CREATE POLICY stops_driver_insert ON public.stops
  FOR INSERT
  WITH CHECK (
    public.is_active_driver()
    AND EXISTS (
      SELECT 1 FROM public.hikes h
      WHERE h.id = stops.hike_id
        AND h.company_id = public.user_company_id()
        AND h.date >= public.company_today(h.company_id)
        AND h.date <= public.company_today(h.company_id) + 1
    )
  );

-- Drivers need exception visibility when generating stops on first load.
CREATE POLICY schedule_exceptions_driver_select ON public.schedule_exceptions
  FOR SELECT
  USING (
    public.is_active_driver()
    AND EXISTS (
      SELECT 1 FROM public.dogs d
      WHERE d.id = schedule_exceptions.dog_id
        AND d.company_id = public.user_company_id()
    )
  );
