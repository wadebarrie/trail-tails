-- Soft-delete routes without losing hike/stop history (FK RESTRICT on hikes).

ALTER TABLE public.routes
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS routes_company_active_idx
  ON public.routes (company_id)
  WHERE is_active = true;
