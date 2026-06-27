import { PageHeader, EmptyState, TableShell } from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { AddExceptionForm } from "@/features/dogs/components/add-exception-form";
import { ExceptionAddedBanner } from "@/features/dogs/components/exception-added-banner";
import {
  ExceptionsTable,
  type ScheduleExceptionRow,
} from "@/features/dogs/components/exceptions-table";
import { formatExceptionDates } from "@/features/dogs/exception-utils";
import { one } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";

export default async function ExceptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; updated?: string; dog?: string }>;
}) {
  const profile = await requireRole("admin");
  const { added: addedId, updated: updatedId, dog: addedDogName } =
    await searchParams;
  const supabase = await createClient();

  const [{ data: exceptions }, { data: dogs }] = await Promise.all([
    supabase
      .from("schedule_exceptions")
      .select(
        `
        id,
        dog_id,
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

  const companyExceptions: ScheduleExceptionRow[] = (exceptions ?? [])
    .map((ex) => {
      const dog = one(
        ex.dogs as
          | { company_id: string; name: string }
          | { company_id: string; name: string }[]
      );
      if (dog?.company_id !== profile.company_id) return null;

      return {
        id: ex.id,
        dog_id: ex.dog_id,
        dogName: dog.name,
        exception_type: ex.exception_type,
        start_date: ex.start_date,
        end_date: ex.end_date,
        reason: ex.reason,
      };
    })
    .filter((ex): ex is ScheduleExceptionRow => ex !== null);

  const addedException = addedId
    ? companyExceptions.find((ex) => ex.id === addedId)
    : null;

  const updatedException = updatedId
    ? companyExceptions.find((ex) => ex.id === updatedId)
    : null;

  const bannerMessage = addedException
    ? `${addedException.dogName} — ${formatExceptionDates(addedException.start_date, addedException.end_date, addedException.exception_type)}`
    : updatedException
      ? `${updatedException.dogName} — exception updated.`
      : addedDogName
        ? `${addedDogName} — schedule updated.`
        : null;

  return (
    <div>
      <PageHeader
        title="Schedule exceptions"
        description="Skips, vacations, and pauses that remove dogs from the hike schedule."
      />

      {bannerMessage ? <ExceptionAddedBanner message={bannerMessage} /> : null}

      <AddExceptionForm dogs={dogs ?? []} />

      {!companyExceptions.length ? (
        <EmptyState message="No schedule exceptions." />
      ) : (
        <section id="schedule-exceptions-list">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
            Current exceptions
          </h2>
          <TableShell minWidth="48rem">
            <ExceptionsTable
              exceptions={companyExceptions}
              dogs={dogs ?? []}
              addedId={addedId}
              updatedId={updatedId}
            />
          </TableShell>
        </section>
      )}
    </div>
  );
}
