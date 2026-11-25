-- Supabase advisor follow-up. Does not insert, update, or delete table rows.
-- Safe to run more than once.
--
-- RLS helpers stay executable by `authenticated` because policies run as that
-- role. They are not executable by `anon`. Trigger-only functions are not
-- executable by either API role. `supabase_auth_admin` keeps `handle_new_user`
-- so the auth.users trigger can still fire.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated, authenticator;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

REVOKE ALL ON FUNCTION public.create_default_subscription_for_company() FROM PUBLIC, anon, authenticated, authenticator;
GRANT EXECUTE ON FUNCTION public.create_default_subscription_for_company() TO service_role;

REVOKE ALL ON FUNCTION public.user_company_id() FROM PUBLIC, anon, authenticator;
REVOKE ALL ON FUNCTION public.user_role() FROM PUBLIC, anon, authenticator;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticator;
REVOKE ALL ON FUNCTION public.is_active_driver() FROM PUBLIC, anon, authenticator;
REVOKE ALL ON FUNCTION public.is_platform_owner() FROM PUBLIC, anon, authenticator;
REVOKE ALL ON FUNCTION public.company_today(uuid) FROM PUBLIC, anon, authenticator;

GRANT EXECUTE ON FUNCTION public.user_company_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_active_driver() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_platform_owner() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.company_today(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS stripe_webhook_events_deny_api ON public.stripe_webhook_events;
CREATE POLICY stripe_webhook_events_deny_api
  ON public.stripe_webhook_events
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.stripe_webhook_events IS
  'Stripe webhook idempotency. Deny-all for anon and authenticated. The service role bypasses RLS and is the only writer (/api/webhooks/stripe).';

COMMENT ON POLICY stripe_webhook_events_deny_api ON public.stripe_webhook_events IS
  'Explicit deny so RLS-with-no-policy is not mistaken for an open table. Service role bypasses RLS.';
