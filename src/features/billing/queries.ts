import { createClient } from "@/lib/supabase/server";
import { getDateInTimezone } from "@/lib/dates";
import { one } from "@/lib/supabase/relations";
import { deriveBillingStatus } from "@/features/billing/status";
import type { BillingStatus } from "@/features/billing/status";
import type { StopStatus } from "@/types";

export type BillingLineItem = {
  date: string;
  customerId: string;
  customerName: string;
  dogId: string;
  dogName: string;
  pickupStatus: StopStatus;
  dropoffStatus: StopStatus | null;
  billingStatus: BillingStatus;
  billable: boolean;
  rateCents: number | null;
};

export type BillingSummary = {
  totalDays: number;
  billableDays: number;
  cancelledDays: number;
  skippedDays: number;
  noShowDays: number;
  pendingDays: number;
  billableCents: number;
  byCustomer: {
    customerId: string;
    customerName: string;
    billableDays: number;
    billableCents: number;
  }[];
};

type StopRow = {
  status: StopStatus;
  stop_type: "pickup" | "dropoff";
  dog_id: string;
  dogs: unknown;
};

type HikeRow = {
  date: string;
  stops: StopRow[] | null;
};

type DogJoin = {
  id: string;
  name: string;
  hike_rate_cents: number | null;
  customer_id: string;
  customers: unknown;
};

export function summarizeBilling(items: BillingLineItem[]): BillingSummary {
  const byCustomerMap = new Map<
    string,
    { customerName: string; billableDays: number; billableCents: number }
  >();

  let billableDays = 0;
  let billableCents = 0;
  let cancelledDays = 0;
  let skippedDays = 0;
  let noShowDays = 0;
  let pendingDays = 0;

  for (const item of items) {
    if (item.billable) {
      billableDays += 1;
      if (item.rateCents != null) billableCents += item.rateCents;
    } else if (item.billingStatus === "cancelled") {
      cancelledDays += 1;
    } else if (item.billingStatus === "skipped") {
      skippedDays += 1;
    } else if (item.billingStatus === "no_show") {
      noShowDays += 1;
    } else {
      pendingDays += 1;
    }

    if (item.billable) {
      const bucket = byCustomerMap.get(item.customerId) ?? {
        customerName: item.customerName,
        billableDays: 0,
        billableCents: 0,
      };
      bucket.billableDays += 1;
      if (item.rateCents != null) bucket.billableCents += item.rateCents;
      byCustomerMap.set(item.customerId, bucket);
    }
  }

  return {
    totalDays: items.length,
    billableDays,
    cancelledDays,
    skippedDays,
    noShowDays,
    pendingDays,
    billableCents,
    byCustomer: [...byCustomerMap.entries()]
      .map(([customerId, row]) => ({ customerId, ...row }))
      .sort((a, b) => a.customerName.localeCompare(b.customerName)),
  };
}

export async function getBillingLineItems(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<BillingLineItem[]> {
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("timezone, default_hike_rate_cents")
    .eq("id", companyId)
    .single();

  const timeZone = company?.timezone ?? "America/Los_Angeles";
  const today = getDateInTimezone(timeZone, 0);
  const defaultRate = company?.default_hike_rate_cents ?? null;

  const { data: hikes, error } = await supabase
    .from("hikes")
    .select(
      `
      date,
      stops (
        status,
        stop_type,
        dog_id,
        dogs (
          id,
          name,
          hike_rate_cents,
          customer_id,
          customers ( id, owner_name )
        )
      )
    `
    )
    .eq("company_id", companyId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) throw new Error(error.message);

  const items: BillingLineItem[] = [];

  for (const hike of (hikes ?? []) as HikeRow[]) {
    const byDog = new Map<
      string,
      { pickup?: StopRow; dropoff?: StopRow }
    >();

    for (const stop of hike.stops ?? []) {
      const dog = one(stop.dogs as DogJoin | DogJoin[] | null);
      if (!dog) continue;
      const bucket = byDog.get(stop.dog_id) ?? {};
      if (stop.stop_type === "pickup") bucket.pickup = stop;
      else bucket.dropoff = stop;
      byDog.set(stop.dog_id, bucket);
    }

    for (const [, pair] of byDog) {
      const pickup = pair.pickup;
      const dog = one(
        (pickup?.dogs ?? pair.dropoff?.dogs) as DogJoin | DogJoin[] | null
      );
      const customer = one(
        dog?.customers as
          | { id: string; owner_name: string }
          | { id: string; owner_name: string }[]
          | null
      );
      if (!dog || !customer || !pickup) continue;

      const dropoffStatus = pair.dropoff?.status ?? null;
      const { billingStatus, billable } = deriveBillingStatus(
        pickup.status,
        dropoffStatus,
        hike.date,
        today
      );

      const rateCents = dog.hike_rate_cents ?? defaultRate;

      items.push({
        date: hike.date,
        customerId: customer.id,
        customerName: customer.owner_name,
        dogId: dog.id,
        dogName: dog.name,
        pickupStatus: pickup.status,
        dropoffStatus,
        billingStatus,
        billable,
        rateCents,
      });
    }
  }

  items.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    const byCustomer = a.customerName.localeCompare(b.customerName);
    if (byCustomer !== 0) return byCustomer;
    return a.dogName.localeCompare(b.dogName);
  });

  return items;
}

export function defaultBillingDateRange(timeZone: string): {
  start: string;
  end: string;
} {
  const end = getDateInTimezone(timeZone, 0);
  const [year, month] = end.split("-");
  return { start: `${year}-${month}-01`, end };
}

export function formatCentsDisplay(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
