-- Route schedule: which days of the week each route runs

CREATE TABLE public.route_schedule_days (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id     uuid        NOT NULL REFERENCES public.routes (id) ON DELETE CASCADE,
  day_of_week  smallint    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (route_id, day_of_week)
);

CREATE INDEX route_schedule_days_route_id_idx ON public.route_schedule_days (route_id);

ALTER TABLE public.route_schedule_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY route_schedule_days_admin_all ON public.route_schedule_days
  FOR ALL
  USING (
    public.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.routes r
      WHERE r.id = route_schedule_days.route_id
        AND r.company_id = public.user_company_id()
    )
  )
  WITH CHECK (
    public.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.routes r
      WHERE r.id = route_schedule_days.route_id
        AND r.company_id = public.user_company_id()
    )
  );

CREATE POLICY route_schedule_days_driver_select ON public.route_schedule_days
  FOR SELECT
  USING (
    public.is_active_driver()
    AND EXISTS (
      SELECT 1 FROM public.routes r
      WHERE r.id = route_schedule_days.route_id
        AND r.company_id = public.user_company_id()
    )
  );

-- Backfill Mon–Fri for existing routes (matches demo dog schedules)
INSERT INTO public.route_schedule_days (route_id, day_of_week)
SELECT r.id, dow.day
FROM public.routes r
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS dow(day)
ON CONFLICT (route_id, day_of_week) DO NOTHING;
