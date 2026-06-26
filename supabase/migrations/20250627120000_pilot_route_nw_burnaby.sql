-- Pilot route: 2× New Westminster, Lowland Drive (Burnaby), 225 Mowat St (NW)
-- Updates Sam Patel's route (d0000000-0000-0000-0000-000000000002)

UPDATE public.routes
SET name = 'New Westminster Burnaby'
WHERE id = 'd0000000-0000-0000-0000-000000000002';

UPDATE public.customers SET
  address = '610 Sixth Ave, New Westminster, BC',
  address_lat = 49.21262,
  address_lng = -122.92073
WHERE id = 'b0000000-0000-0000-0000-000000000008';

UPDATE public.customers SET
  address = '888 Carnarvon St, New Westminster, BC',
  address_lat = 49.2015837,
  address_lng = -122.9132319
WHERE id = 'b0000000-0000-0000-0000-000000000002';

UPDATE public.customers SET
  address = '7500 Lowland Drive, Burnaby, BC',
  address_lat = 49.1910592,
  address_lng = -122.9934563
WHERE id = 'b0000000-0000-0000-0000-000000000007';

UPDATE public.customers SET
  address = '225 Mowat Street, New Westminster, BC',
  address_lat = 49.2041218,
  address_lng = -122.9214059
WHERE id = 'b0000000-0000-0000-0000-000000000009';

UPDATE public.dogs SET route_id = 'd0000000-0000-0000-0000-000000000002', route_sort_order = 0
  WHERE id = 'c0000000-0000-0000-0000-000000000008';
UPDATE public.dogs SET route_id = 'd0000000-0000-0000-0000-000000000002', route_sort_order = 1
  WHERE id = 'c0000000-0000-0000-0000-000000000002';
UPDATE public.dogs SET route_id = 'd0000000-0000-0000-0000-000000000002', route_sort_order = 2
  WHERE id = 'c0000000-0000-0000-0000-000000000007';
UPDATE public.dogs SET route_id = 'd0000000-0000-0000-0000-000000000002', route_sort_order = 3
  WHERE id = 'c0000000-0000-0000-0000-000000000009';
