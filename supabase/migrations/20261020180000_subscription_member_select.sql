-- Drivers need to read their own company's subscription so middleware
-- can tell an active account from a missing one. Admins already have select.

CREATE POLICY subscriptions_member_select ON public.subscriptions
  FOR SELECT
  USING (company_id = public.user_company_id());
