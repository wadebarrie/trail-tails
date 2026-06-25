-- Trail Tails: initial schema (enums, tables, indexes, triggers)
-- Phase 3 migration 1/3

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.user_role AS ENUM ('admin', 'driver');

CREATE TYPE public.exception_type AS ENUM ('skip_date', 'vacation', 'pause');

CREATE TYPE public.hike_status AS ENUM ('planned', 'in_progress', 'completed');

CREATE TYPE public.stop_type AS ENUM ('pickup', 'dropoff');

CREATE TYPE public.stop_status AS ENUM (
  'scheduled',
  'en_route',
  'picked_up',
  'dropped_off',
  'skipped',
  'cancelled'
);

CREATE TYPE public.command_type AS ENUM (
  'skip_tomorrow',
  'skip_weekday',
  'skip_date',
  'vacation',
  'pause',
  'resume',
  'help',
  'unknown'
);

CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'declined');

CREATE TYPE public.sms_direction AS ENUM ('inbound', 'outbound');

CREATE TYPE public.sms_status AS ENUM (
  'received',
  'queued',
  'sent',
  'delivered',
  'failed'
);

CREATE TYPE public.notification_type AS ENUM (
  'night_before',
  'en_route',
  'picked_up',
  'dropped_off',
  'request_received',
  'request_approved',
  'request_declined',
  'help'
);

CREATE TYPE public.notification_status AS ENUM ('pending', 'sent', 'failed');

-- ---------------------------------------------------------------------------
-- Utility: updated_at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------

CREATE TABLE public.companies (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        text        NOT NULL,
  timezone                    text        NOT NULL DEFAULT 'America/Los_Angeles',
  default_pickup_window_start time        DEFAULT '08:00',
  default_pickup_window_end   time        DEFAULT '08:30',
  twilio_phone_number         text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER companies_set_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- profiles (extends auth.users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id         uuid             PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  company_id uuid             NOT NULL REFERENCES public.companies (id) ON DELETE RESTRICT,
  role       public.user_role NOT NULL,
  full_name  text             NOT NULL,
  phone      text,
  is_active  boolean          NOT NULL DEFAULT true,
  created_at timestamptz      NOT NULL DEFAULT now(),
  updated_at timestamptz      NOT NULL DEFAULT now()
);

CREATE INDEX profiles_company_id_idx ON public.profiles (company_id);
CREATE INDEX profiles_company_role_idx ON public.profiles (company_id, role);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile when auth user is created (requires user_metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, company_id, role, full_name)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data ->> 'company_id')::uuid,
    COALESCE(
      (NEW.raw_user_meta_data ->> 'role')::public.user_role,
      'driver'::public.user_role
    ),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------

CREATE TABLE public.customers (
  id          uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid             NOT NULL REFERENCES public.companies (id) ON DELETE RESTRICT,
  owner_name  text             NOT NULL,
  phone       text             NOT NULL,
  email       text,
  address     text             NOT NULL,
  address_lat double precision,
  address_lng double precision,
  notes       text,
  is_active   boolean          NOT NULL DEFAULT true,
  created_at  timestamptz      NOT NULL DEFAULT now(),
  updated_at  timestamptz      NOT NULL DEFAULT now(),
  UNIQUE (company_id, phone)
);

CREATE INDEX customers_company_active_idx ON public.customers (company_id, is_active);
CREATE INDEX customers_company_owner_idx ON public.customers (company_id, owner_name);

CREATE TRIGGER customers_set_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- dogs
-- ---------------------------------------------------------------------------

CREATE TABLE public.dogs (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            uuid        NOT NULL REFERENCES public.companies (id) ON DELETE RESTRICT,
  customer_id           uuid        NOT NULL REFERENCES public.customers (id) ON DELETE RESTRICT,
  name                  text        NOT NULL,
  breed                 text,
  notes                 text,
  is_active             boolean     NOT NULL DEFAULT true,
  pickup_window_start   time        NOT NULL DEFAULT '08:00',
  pickup_window_end     time        NOT NULL DEFAULT '08:30',
  route_sort_order      integer     NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX dogs_customer_id_idx ON public.dogs (customer_id);
CREATE INDEX dogs_company_active_idx ON public.dogs (company_id, is_active);
CREATE INDEX dogs_company_route_order_idx ON public.dogs (company_id, route_sort_order);

CREATE TRIGGER dogs_set_updated_at
  BEFORE UPDATE ON public.dogs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- dog_schedule_days (recurring schedule)
-- ---------------------------------------------------------------------------

CREATE TABLE public.dog_schedule_days (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id      uuid        NOT NULL REFERENCES public.dogs (id) ON DELETE CASCADE,
  day_of_week smallint    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dog_id, day_of_week)
);

CREATE INDEX dog_schedule_days_dog_id_idx ON public.dog_schedule_days (dog_id);

-- ---------------------------------------------------------------------------
-- pending_requests (before schedule_exceptions — FK target)
-- ---------------------------------------------------------------------------

CREATE TABLE public.pending_requests (
  id               uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid                  NOT NULL REFERENCES public.companies (id) ON DELETE RESTRICT,
  customer_id      uuid                  NOT NULL REFERENCES public.customers (id) ON DELETE RESTRICT,
  raw_body         text                  NOT NULL,
  command_type     public.command_type   NOT NULL,
  parsed_payload   jsonb                 NOT NULL DEFAULT '{}',
  status           public.request_status NOT NULL DEFAULT 'pending',
  resolved_by      uuid                  REFERENCES public.profiles (id) ON DELETE SET NULL,
  resolved_at      timestamptz,
  admin_notes      text,
  idempotency_key  text                  NOT NULL UNIQUE,
  created_at       timestamptz           NOT NULL DEFAULT now()
);

CREATE INDEX pending_requests_company_status_idx
  ON public.pending_requests (company_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- schedule_exceptions
-- ---------------------------------------------------------------------------

CREATE TABLE public.schedule_exceptions (
  id                 uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id             uuid                    NOT NULL REFERENCES public.dogs (id) ON DELETE CASCADE,
  exception_type     public.exception_type   NOT NULL,
  start_date         date                    NOT NULL,
  end_date           date,
  reason             text,
  pending_request_id uuid                    REFERENCES public.pending_requests (id) ON DELETE SET NULL,
  created_by         uuid                    REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at         timestamptz             NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX schedule_exceptions_dog_dates_idx
  ON public.schedule_exceptions (dog_id, start_date, end_date);

-- ---------------------------------------------------------------------------
-- hikes
-- ---------------------------------------------------------------------------

CREATE TABLE public.hikes (
  id         uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid                NOT NULL REFERENCES public.companies (id) ON DELETE RESTRICT,
  date       date                NOT NULL,
  driver_id  uuid                REFERENCES public.profiles (id) ON DELETE SET NULL,
  status     public.hike_status  NOT NULL DEFAULT 'planned',
  notes      text,
  created_at timestamptz         NOT NULL DEFAULT now(),
  updated_at timestamptz         NOT NULL DEFAULT now(),
  UNIQUE (company_id, date)
);

CREATE INDEX hikes_company_date_idx ON public.hikes (company_id, date);
CREATE INDEX hikes_driver_date_idx ON public.hikes (driver_id, date);

CREATE TRIGGER hikes_set_updated_at
  BEFORE UPDATE ON public.hikes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- stops
-- ---------------------------------------------------------------------------

CREATE TABLE public.stops (
  id            uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  hike_id       uuid                NOT NULL REFERENCES public.hikes (id) ON DELETE CASCADE,
  dog_id        uuid                NOT NULL REFERENCES public.dogs (id) ON DELETE RESTRICT,
  stop_type     public.stop_type    NOT NULL,
  status        public.stop_status  NOT NULL DEFAULT 'scheduled',
  window_start  time                NOT NULL,
  window_end    time                NOT NULL,
  en_route_at   timestamptz,
  completed_at  timestamptz,
  driver_lat    double precision,
  driver_lng    double precision,
  eta_minutes   integer,
  sort_order    integer             NOT NULL,
  created_at    timestamptz         NOT NULL DEFAULT now(),
  updated_at    timestamptz         NOT NULL DEFAULT now(),
  UNIQUE (hike_id, dog_id, stop_type),
  UNIQUE (hike_id, stop_type, sort_order)
);

CREATE INDEX stops_hike_type_order_idx ON public.stops (hike_id, stop_type, sort_order);
CREATE INDEX stops_hike_type_status_idx ON public.stops (hike_id, stop_type, status);
CREATE INDEX stops_dog_id_idx ON public.stops (dog_id);

CREATE TRIGGER stops_set_updated_at
  BEFORE UPDATE ON public.stops
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sms_messages
-- ---------------------------------------------------------------------------

CREATE TABLE public.sms_messages (
  id                 uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         uuid                  NOT NULL REFERENCES public.companies (id) ON DELETE RESTRICT,
  customer_id        uuid                  REFERENCES public.customers (id) ON DELETE SET NULL,
  direction          public.sms_direction  NOT NULL,
  from_number        text                  NOT NULL,
  to_number          text                  NOT NULL,
  body               text                  NOT NULL,
  twilio_sid         text                  UNIQUE,
  status             public.sms_status     NOT NULL DEFAULT 'received',
  error_message      text,
  pending_request_id uuid                  REFERENCES public.pending_requests (id) ON DELETE SET NULL,
  created_at         timestamptz           NOT NULL DEFAULT now()
);

CREATE INDEX sms_messages_company_created_idx
  ON public.sms_messages (company_id, created_at DESC);
CREATE INDEX sms_messages_customer_created_idx
  ON public.sms_messages (customer_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- notification_log
-- ---------------------------------------------------------------------------

CREATE TABLE public.notification_log (
  id                uuid                        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid                        NOT NULL REFERENCES public.companies (id) ON DELETE RESTRICT,
  customer_id       uuid                        REFERENCES public.customers (id) ON DELETE SET NULL,
  dog_id            uuid                        REFERENCES public.dogs (id) ON DELETE SET NULL,
  stop_id           uuid                        REFERENCES public.stops (id) ON DELETE SET NULL,
  notification_type public.notification_type    NOT NULL,
  channel           text                        NOT NULL DEFAULT 'sms',
  body              text                        NOT NULL,
  status            public.notification_status  NOT NULL DEFAULT 'pending',
  error_message     text,
  sms_message_id    uuid                        REFERENCES public.sms_messages (id) ON DELETE SET NULL,
  created_at        timestamptz                 NOT NULL DEFAULT now()
);

CREATE INDEX notification_log_company_created_idx
  ON public.notification_log (company_id, created_at DESC);
CREATE INDEX notification_log_customer_created_idx
  ON public.notification_log (customer_id, created_at DESC);
CREATE INDEX notification_log_stop_id_idx ON public.notification_log (stop_id);

-- ---------------------------------------------------------------------------
-- audit_log
-- ---------------------------------------------------------------------------

CREATE TABLE public.audit_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES public.companies (id) ON DELETE RESTRICT,
  actor_id    uuid        REFERENCES public.profiles (id) ON DELETE SET NULL,
  action      text        NOT NULL,
  entity_type text        NOT NULL,
  entity_id   uuid        NOT NULL,
  metadata    jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_company_created_idx
  ON public.audit_log (company_id, created_at DESC);
CREATE INDEX audit_log_entity_idx ON public.audit_log (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- Auth helper functions (used by RLS)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'::public.user_role
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_driver()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'driver'::public.user_role
      AND is_active = true
  );
$$;

-- Company-local today/tomorrow for driver access windows
CREATE OR REPLACE FUNCTION public.company_today(p_company_id uuid)
RETURNS date
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (timezone(c.timezone, now()))::date
  FROM public.companies c
  WHERE c.id = p_company_id;
$$;
