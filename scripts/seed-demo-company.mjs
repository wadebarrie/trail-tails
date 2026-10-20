/**
 * Creates the shareable Harbour Hikes sales demo company.
 * Idempotent: re-running keeps the same company and refreshes logins.
 *
 * Usage: node scripts/seed-demo-company.mjs
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */

import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const COMPANY_NAME = "Harbour Hikes";
const PASSWORD = "CoastalDemo26!";
const TIMEZONE = "America/Vancouver";

const USERS = [
  {
    email: "demo@packroute.app",
    role: "admin",
    full_name: "Maya Chen",
    can_drive: true,
    demo_login: true,
  },
  {
    email: "demo-driver@packroute.app",
    role: "driver",
    full_name: "Sam Reid",
    can_drive: true,
    demo_login: false,
  },
];

const CUSTOMERS = [
  {
    key: "priya",
    owner_name: "Priya Nair",
    phone: "+16045550101",
    email: "priya.nair@example.com",
    address: "1845 Yew St, Vancouver, BC V6K 3E9",
    address_line1: "1845 Yew St",
    city: "Vancouver",
    state_province: "BC",
    postal_code: "V6K 3E9",
  },
  {
    key: "owen",
    owner_name: "Owen Blake",
    phone: "+16045550102",
    email: "owen.blake@example.com",
    address: "3321 Chesterfield Ave, North Vancouver, BC V7N 3M7",
    address_line1: "3321 Chesterfield Ave",
    city: "North Vancouver",
    state_province: "BC",
    postal_code: "V7N 3M7",
  },
  {
    key: "lena",
    owner_name: "Lena Cho",
    phone: "+16045550103",
    email: "lena.cho@example.com",
    address: "908 W 15th Ave, Vancouver, BC V5Z 1S1",
    address_line1: "908 W 15th Ave",
    city: "Vancouver",
    state_province: "BC",
    postal_code: "V5Z 1S1",
  },
  {
    key: "marcus",
    owner_name: "Marcus Hale",
    phone: "+16045550104",
    email: "marcus.hale@example.com",
    address: "215 Lonsdale Ave, North Vancouver, BC V7M 2E9",
    address_line1: "215 Lonsdale Ave",
    city: "North Vancouver",
    state_province: "BC",
    postal_code: "V7M 2E9",
  },
  {
    key: "aisha",
    owner_name: "Aisha Rahman",
    phone: "+16045550105",
    email: "aisha.rahman@example.com",
    address: "4100 W 4th Ave, Vancouver, BC V6R 1P8",
    address_line1: "4100 W 4th Ave",
    city: "Vancouver",
    state_province: "BC",
    postal_code: "V6R 1P8",
  },
  {
    key: "theo",
    owner_name: "Theo Marin",
    phone: "+16045550106",
    email: "theo.marin@example.com",
    address: "88 Lonsdale Ave, North Vancouver, BC V7M 2E6",
    address_line1: "88 Lonsdale Ave",
    city: "North Vancouver",
    state_province: "BC",
    postal_code: "V7M 2E6",
  },
];

function headers(extra = {}) {
  return {
    Authorization: `Bearer ${SERVICE_KEY}`,
    apikey: SERVICE_KEY,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function rest(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: headers(options.headers),
  });
  const text = await res.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!res.ok) {
    const message =
      body?.message || body?.msg || body?.error || `${res.status} ${path}`;
    throw new Error(message);
  }
  return body;
}

async function findCompany() {
  const rows = await rest(
    `companies?name=eq.${encodeURIComponent(COMPANY_NAME)}&select=id,name&limit=1`
  );
  return rows?.[0] ?? null;
}

async function patchOptional(path, fields) {
  for (const [key, value] of Object.entries(fields)) {
    try {
      await rest(path, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (err) {
      console.warn(`  ! Skipped ${key}: ${err.message}`);
    }
  }
}

async function ensureCompany() {
  const existing = await findCompany();
  let id = existing?.id;

  if (!id) {
    const rows = await rest("companies", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        name: COMPANY_NAME,
        timezone: TIMEZONE,
      }),
    });
    id = rows?.[0]?.id;
    if (!id) throw new Error("Company insert returned no id");
    console.log(`✓ Created company  ${COMPANY_NAME}  ${id}`);
  } else {
    console.log(`· Company exists  ${COMPANY_NAME}  ${id}`);
  }

  await patchOptional(`companies?id=eq.${id}`, {
    timezone: TIMEZONE,
    route_cadence: "twice",
    onboarding_completed_at: new Date().toISOString(),
    night_before_reminder_time: "18:00",
    default_pickup_window_start: "07:30",
    default_pickup_window_end: "08:30",
    default_hike_rate_cents: 4200,
  });

  return id;
}

async function markSubscriptionActive(companyId) {
  await patchOptional(`subscriptions?company_id=eq.${companyId}`, {
    plan: "two_hikers",
    status: "active",
    monthly_price: 179,
    billing_currency: "CAD",
    trial_ends_at: null,
    notes: "Sales demo. Do not bill.",
  });
  console.log("✓ Subscription updated for the demo");
}

async function getAuthUserByEmail(email) {
  let page = 1;
  while (page < 20) {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=200`,
      { headers: headers() }
    );
    const body = await res.json().catch(() => ({}));
    const users = body?.users ?? [];
    const match = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (users.length < 200) return null;
    page += 1;
  }
  return null;
}

async function ensureUser(companyId, user) {
  const metadata = {
    company_id: companyId,
    role: user.role,
    full_name: user.full_name,
    can_drive: user.can_drive,
  };
  const existing = await getAuthUserByEmail(user.email);

  if (!existing) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        email: user.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: metadata,
        app_metadata: user.demo_login ? { demo_login: true } : {},
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.msg || body?.message || `create ${user.email}`);
    }
    console.log(`✓ Created login  ${user.email} (${user.role})`);
  } else {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existing.id}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { ...existing.user_metadata, ...metadata },
        app_metadata: {
          ...existing.app_metadata,
          ...(user.demo_login ? { demo_login: true } : {}),
        },
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.msg || body?.message || `update ${user.email}`);
    }
    console.log(`· Refreshed login  ${user.email} (${user.role})`);
  }

  const authUser = await getAuthUserByEmail(user.email);
  if (!authUser) throw new Error(`Missing auth user ${user.email}`);

  await rest(`profiles?id=eq.${authUser.id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      company_id: companyId,
      role: user.role,
      full_name: user.full_name,
      can_drive: user.can_drive,
      is_active: true,
      is_platform_owner: false,
    }),
  });

  return authUser.id;
}

async function countRows(path) {
  const rows = await rest(path);
  return rows?.length ?? 0;
}

async function seedRoster(companyId, driverIds) {
  const dogCount = await countRows(
    `dogs?company_id=eq.${companyId}&select=id`
  );
  if (dogCount > 0) {
    console.log(`· Roster already present (${dogCount} dogs)`);
    return;
  }

  const vehicles = await rest("vehicles", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([
      { company_id: companyId, name: "White Sprinter", plate: "HK 2401", capacity: 8 },
      { company_id: companyId, name: "Grey Transit", plate: "HK 2402", capacity: 6 },
    ]),
  });
  const sprinter = vehicles.find((v) => v.name === "White Sprinter");
  const transit = vehicles.find((v) => v.name === "Grey Transit");

  const routes = await rest("routes", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([
      {
        company_id: companyId,
        name: "Kitsilano morning",
        sort_order: 0,
        period: "morning",
        default_driver_id: driverIds.sam,
        default_vehicle_id: sprinter.id,
      },
      {
        company_id: companyId,
        name: "North Shore morning",
        sort_order: 1,
        period: "morning",
        default_driver_id: driverIds.maya,
        default_vehicle_id: transit.id,
      },
      {
        company_id: companyId,
        name: "Kitsilano afternoon",
        sort_order: 2,
        period: "afternoon",
        default_driver_id: driverIds.sam,
        default_vehicle_id: sprinter.id,
      },
    ]),
  });
  const byName = Object.fromEntries(routes.map((r) => [r.name, r]));

  const scheduleDays = [];
  for (const route of routes) {
    for (let day = 0; day <= 6; day += 1) {
      scheduleDays.push({ route_id: route.id, day_of_week: day });
    }
  }
  await rest("route_schedule_days", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(scheduleDays),
  });

  const customers = await rest("customers", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(
      CUSTOMERS.map((c) => ({
        company_id: companyId,
        owner_name: c.owner_name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        address_line1: c.address_line1,
        city: c.city,
        state_province: c.state_province,
        postal_code: c.postal_code,
        night_before_reminders_enabled: true,
      }))
    ),
  });
  const customerId = Object.fromEntries(
    customers.map((row) => [
      CUSTOMERS.find((c) => c.phone === row.phone).key,
      row.id,
    ])
  );

  const dogRows = [
    ["Miso", "Golden retriever", "priya", "Kitsilano morning", "07:30", "08:15", 0],
    ["Nori", "Corgi", "priya", "Kitsilano morning", "07:30", "08:15", 1],
    ["Pepper", "Australian shepherd", "lena", "Kitsilano morning", "08:00", "08:45", 2],
    ["Banjo", "Labrador", "owen", "North Shore morning", "07:45", "08:30", 0],
    ["Juniper", "Husky", "marcus", "North Shore morning", "08:15", "09:00", 1],
    ["Clover", "Goldendoodle", "aisha", "Kitsilano afternoon", "13:00", "13:45", 0],
    ["Maple", "Shepherd", "theo", "Kitsilano afternoon", "13:30", "14:15", 1],
    ["River", "Beagle", "lena", "Kitsilano afternoon", "14:00", "14:45", 2],
  ];

  const dogs = await rest("dogs", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(
      dogRows.map(([name, breed, customer, route, start, end, order]) => ({
        company_id: companyId,
        customer_id: customerId[customer],
        route_id: byName[route].id,
        name,
        breed,
        schedule_type: "recurring",
        pickup_window_start: start,
        pickup_window_end: end,
        dropoff_window_start: route.includes("afternoon") ? "16:30" : "12:00",
        dropoff_window_end: route.includes("afternoon") ? "17:15" : "12:45",
        route_sort_order: order,
        hike_rate_cents: 4200,
      }))
    ),
  });

  const dogDays = [];
  for (const dog of dogs) {
    for (let day = 0; day <= 6; day += 1) {
      dogDays.push({ dog_id: dog.id, day_of_week: day });
    }
  }
  await rest("dog_schedule_days", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(dogDays),
  });

  const priya = customers.find((c) => c.phone === "+16045550101");
  await rest("pending_requests", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      company_id: companyId,
      customer_id: priya.id,
      raw_body: "SKIP TOMORROW",
      command_type: "skip_tomorrow",
      parsed_payload: {},
      status: "pending",
      idempotency_key: `harbour-hikes-demo-skip-${companyId}`,
    }),
  });

  console.log(`✓ Roster: ${customers.length} customers, ${dogs.length} dogs, 3 routes`);
}

function upcomingDates(count) {
  const dates = [];
  const cursor = new Date();
  cursor.setUTCHours(20, 0, 0, 0);
  while (dates.length < count) {
    const label = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(cursor);
    if (!dates.includes(label)) dates.push(label);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function syncHikes(companyId) {
  const dates = upcomingDates(14);
  const result = spawnSync(
    "npx",
    ["tsx", "scripts/sync-stops.ts", ...dates],
    {
      cwd: root,
      env: { ...process.env, DEMO_COMPANY_ID: companyId },
      stdio: "inherit",
    }
  );
  if (result.status !== 0) {
    throw new Error("Hike sync failed");
  }
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing Supabase URL or service role key in .env.local");
    process.exit(1);
  }

  const host = new URL(SUPABASE_URL).host;
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    console.error(`Refusing to seed a local database (${host}).`);
    process.exit(1);
  }

  console.log(`Seeding Harbour Hikes on ${host}\n`);
  const companyId = await ensureCompany();
  await markSubscriptionActive(companyId);

  const ids = {};
  for (const user of USERS) {
    const id = await ensureUser(companyId, user);
    if (user.email.startsWith("demo-driver")) ids.sam = id;
    if (user.role === "admin") ids.maya = id;
  }

  await seedRoster(companyId, ids);
  syncHikes(companyId);

  console.log("\n--- Harbour Hikes demo ---");
  console.log("Office:  demo@packroute.app");
  console.log("Driver:  demo-driver@packroute.app");
  console.log(`Password: ${PASSWORD}`);
  console.log(`Company: ${companyId}`);
  console.log("Sign in: https://packroute.app/login");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
