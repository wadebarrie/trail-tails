-- Operational logs for SMS, API, and background job failures (admin-visible).

CREATE TABLE public.system_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid        REFERENCES public.companies (id) ON DELETE CASCADE,
  level      text        NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  category   text        NOT NULL,
  message    text        NOT NULL,
  context    jsonb       NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX system_logs_company_created_idx
  ON public.system_logs (company_id, created_at DESC);

CREATE INDEX system_logs_errors_idx
  ON public.system_logs (created_at DESC)
  WHERE level IN ('warn', 'error');

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_logs_admin_select ON public.system_logs
  FOR SELECT
  USING (
    public.is_admin()
    AND (company_id IS NULL OR company_id = public.user_company_id())
  );
