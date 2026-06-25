import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/components/ui";
import { DogForm } from "@/features/dogs/components/dog-form";
import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import type { Customer, Dog } from "@/types";

export default async function EditDogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole("admin");
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: dog }, { data: customers }, { data: scheduleRows }] =
    await Promise.all([
      supabase
        .from("dogs")
        .select("*")
        .eq("id", id)
        .eq("company_id", profile.company_id)
        .maybeSingle(),
      supabase
        .from("customers")
        .select("id, owner_name")
        .eq("company_id", profile.company_id)
        .order("owner_name"),
      supabase
        .from("dog_schedule_days")
        .select("day_of_week")
        .eq("dog_id", id),
    ]);

  if (!dog) notFound();

  const dogRecord = dog as Dog;

  return (
    <div>
      <PageHeader title="Edit dog" description={dogRecord.name} />
      <DogForm
        customers={(customers ?? []) as Pick<Customer, "id" | "owner_name">[]}
        dog={dogRecord}
        scheduleDays={((scheduleRows ?? []) as { day_of_week: number }[]).map(
          (r) => r.day_of_week
        )}
      />
    </div>
  );
}
