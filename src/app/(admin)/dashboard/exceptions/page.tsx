import { PageHeader, EmptyState, TableShell } from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { AddExceptionForm } from "@/features/dogs/components/add-exception-form";
import { ExceptionAddedBanner } from "@/features/dogs/components/exception-added-banner";
import { one } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";

function formatExceptionDates(
  startDate: string,
  endDate: string | null,
  exceptionType: string
) {
  if (endDate && endDate !== startDate) {
    return `${startDate} → ${endDate}`;
  }
  if (!endDate && exceptionType === "pause") {
    return `${startDate} (open-ended pause)`;
  }
  if (!endDate) {
    return `${startDate} (open-ended)`;
  }
  return startDate;
}

export default async function ExceptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; dog?: string }>;
}) {
  const profile = await requireRole("admin");
  const { added: addedId, dog: addedDogName } = await searchParams;
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
    const dog = one(
      ex.dogs as
        | { company_id: string; name: string }
        | { company_id: string; name: string }[]
    );
    return dog?.company_id === profile.company_id;
  });

  const addedException = addedId
    ? companyExceptions.find((ex) => ex.id === addedId)
    : null;

  const addedMessage = addedException
    ? `${one(addedException.dogs as { name: string } | { name: string }[])?.name ?? addedDogName ?? "Dog"} — ${formatExceptionDates(addedException.start_date, addedException.end_date, addedException.exception_type)}`
    : addedDogName
      ? `${addedDogName} — schedule updated.`
      : null;

  return (
    <div>
      <PageHeader
        title="Schedule exceptions"
        description="Skips, vacations, and pauses that remove dogs from the hike schedule."
      />

      {addedMessage ? <ExceptionAddedBanner message={addedMessage} /> : null}

      <AddExceptionForm dogs={dogs ?? []} />

      {!companyExceptions.length ? (
        <EmptyState message="No schedule exceptions." />
      ) : (
        <section id="schedule-exceptions-list">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
            Current exceptions
          </h2>
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
                {companyExceptions.map((ex) => {
                  const isNew = ex.id === addedId;
                  return (
                    <tr
                      key={ex.id}
                      className={
                        isNew
                          ? "bg-green-50 ring-1 ring-inset ring-green-200"
                          : undefined
                      }
                    >
                      <td className="px-4 py-3 font-medium">
                        {one(ex.dogs as { name: string } | { name: string }[])
                          ?.name}
                        {isNew ? (
                          <span className="ml-2 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            New
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {ex.exception_type.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {formatExceptionDates(
                          ex.start_date,
                          ex.end_date,
                          ex.exception_type
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {ex.reason ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableShell>
        </section>
      )}
    </div>
  );
}
