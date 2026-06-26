-- Trail Tails: development seed data
-- Phase 3 migration 3/3
--
-- Auth users are NOT created here. After running migrations:
--   1. Create admin + driver users in Supabase Auth (Dashboard or CLI)
--   2. Set user_metadata: { "company_id": "<company_uuid>", "role": "admin"|"driver", "full_name": "..." }
--   3. Or insert profiles manually linking to auth.users ids
--
-- Fixed UUIDs below make local development reproducible.

-- ---------------------------------------------------------------------------
-- Company
-- ---------------------------------------------------------------------------

INSERT INTO public.companies (
  id,
  name,
  timezone,
  default_pickup_window_start,
  default_pickup_window_end
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'PackRoute',
  'America/Los_Angeles',
  '08:00',
  '08:30'
);

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------

INSERT INTO public.customers (
  id, company_id, owner_name, phone, email, address, address_lat, address_lng, notes
) VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Wade Barrie',
    '+15555550101',
    'wade@example.com',
    '123 Forest Ave, Portland, OR 97201',
    45.5231,
    -122.6765,
    'Gate code: 4521'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Sarah Chen',
    '+15555550102',
    'sarah@example.com',
    '456 Mountain Rd, Portland, OR 97202',
    45.5123,
    -122.6587,
    NULL
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Mike Johnson',
    '+15555550103',
    NULL,
    '789 Trail Blvd, Portland, OR 97203',
    45.5342,
    -122.6421,
    'Dog is shy — knock softly'
  );

-- ---------------------------------------------------------------------------
-- Dogs (route_sort_order defines default pickup/dropoff sequence)
-- ---------------------------------------------------------------------------

INSERT INTO public.dogs (
  id, company_id, customer_id, name, breed,
  pickup_window_start, pickup_window_end, route_sort_order, notes
) VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Rawley',
    'Golden Retriever',
    '08:00', '08:30', 0,
    'Friendly, pulls on leash'
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'Mariner',
    'Labrador',
    '08:15', '08:45', 1,
    NULL
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000003',
    'Pepper',
    'Border Collie',
    '08:30', '09:00', 2,
    'Needs harness'
  );

-- ---------------------------------------------------------------------------
-- Recurring schedules
-- Rawley: Mon/Tue/Thu (1, 2, 4)
-- Mariner: Mon/Wed/Fri (1, 3, 5)
-- Pepper: Tue/Thu (2, 4)
-- ---------------------------------------------------------------------------

INSERT INTO public.dog_schedule_days (dog_id, day_of_week) VALUES
  ('c0000000-0000-0000-0000-000000000001', 1),
  ('c0000000-0000-0000-0000-000000000001', 2),
  ('c0000000-0000-0000-0000-000000000001', 4),
  ('c0000000-0000-0000-0000-000000000002', 1),
  ('c0000000-0000-0000-0000-000000000002', 3),
  ('c0000000-0000-0000-0000-000000000002', 5),
  ('c0000000-0000-0000-0000-000000000003', 2),
  ('c0000000-0000-0000-0000-000000000003', 4);
