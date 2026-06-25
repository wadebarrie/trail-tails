import { PageHeader, EmptyState, TableShell } from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { createScheduleExceptionAction } from "@/features/dogs/actions";
import { one } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";

export default async function ExceptionsPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const [{ data: exceptions }, { data: dogs }] = await Promise.all([
    supabase
      .from("schedule_exceptions")
      .select(
        `
        id,
        exception_type,
        start_date,
        end_date,
        reason,
        created_at,
        dogs ( name, company_id )
      `
      )
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("dogs")
      .select("id, name")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .order("name"),
  ]);

  const companyExceptions = (exceptions ?? []).filter((ex) => {
    const dog = one(ex.dogs as { company_id: string; name: string } | { company_id: string; name: string }[]);
    return dog?.company_id === profile.company_id;
  });

  return (
    <div>
      <PageHeader
        title="Schedule exceptions"
        description="Skips, vacations, and pauses that remove dogs from the hike schedule."
      />

      <div className="mb-8 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-medium text-stone-900">Add exception</h2>
        <form action={createScheduleExceptionAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="dog_id" className="block text-sm text-stone-600">
              Dog
            </label>
            <select
              id="dog_id"
              name="dog_id"
              required
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            >
              <option value="">Select dog</option>
              {(dogs ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="exception_type" className="block text-sm text-stone-600">
              Type
            </label>
            <select
              id="exception_type"
              name="exception_type"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            >
              <option value="skip_date">Skip date</option>
              <option value="vacation">Vacation</option>
              <option value="pause">Pause</option>
            </select>
          </div>
          <div>
            <label htmlFor="start_date" className="block text-sm text-stone-600">
              Start date
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              required
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="end_date" className="block text-sm text-stone-600">
              End date (optional for pause)
            </label>
            <input
              id="end_date"
              name="end_date"
              type="date"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="reason" className="block text-sm text-stone-600">
              Reason
            </label>
            <input
              id="reason"
              name="reason"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <button
              type="submit"
              className="rounded-lg bg-[var(--color-trail-700)] px-4 py-2 text-sm font-medium text-white"
            >
              Add exception
            </button>
          </div>
        </form>
      </div>

      {!companyExceptions.length ? (
        <EmptyState message="No schedule exceptions." />
      ) : (
        <TableShell minWidth="40rem">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Dog</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {companyExceptions.map((ex) => (
                <tr key={ex.id}>
                  <td className="px-4 py-3 font-medium">
                    {one(ex.dogs as { name: string } | { name: string }[])?.name}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{ex.exception_type}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {ex.start_date}
                    {ex.end_date && ex.end_date !== ex.start_date
                      ? ` → ${ex.end_date}`
                      : ""}
                    {!ex.end_date ? " (open-ended)" : ""}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{ex.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}
