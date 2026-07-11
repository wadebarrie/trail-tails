import { requireAdminApiAccess } from "@/features/auth/admin-api";
import { billingReportToCsv } from "@/features/billing/csv";
import { getBillingLineItems } from "@/features/billing/queries";
import { perfAsync } from "@/lib/perf";

export async function GET(request: Request) {
  const access = await requireAdminApiAccess();
  if ("response" in access) return access.response;
  const { profile } = access;

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return new Response("start and end query params required (YYYY-MM-DD)", {
      status: 400,
    });
  }

  if (start > end) {
    return new Response("start must be on or before end", { status: 400 });
  }

  const items = await perfAsync("api billing/export", () =>
    getBillingLineItems(profile.company_id, start, end)
  );
  const csv = billingReportToCsv(items);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="packroute-billing-${start}-to-${end}.csv"`,
    },
  });
}
