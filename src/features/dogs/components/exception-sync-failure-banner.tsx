import Link from "next/link";
import { getRecentExceptionSyncFailure } from "@/features/dogs/exception-sync-status";

export async function ExceptionSyncFailureBanner({
  companyId,
  rebuildHref = "/dashboard/hikes/today",
}: {
  companyId: string;
  rebuildHref?: string;
}) {
  const failure = await getRecentExceptionSyncFailure(companyId);
  if (!failure) return null;

  return (
    <div
      className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
      role="alert"
    >
      <p className="font-medium">Couldn&apos;t update hike stops after a schedule change.</p>
      <p className="mt-1 text-red-800/90">
        The skip/vacation was saved, but Today/Tomorrow may still show that dog.{" "}
        <Link
          href={rebuildHref}
          className="font-semibold underline underline-offset-2 hover:text-red-950"
        >
          Rebuild today&apos;s stops
        </Link>{" "}
        (or tomorrow) to sync, or check System logs.
      </p>
    </div>
  );
}
