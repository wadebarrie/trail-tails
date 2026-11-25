/* eslint-disable @next/next/no-img-element -- signed Storage URLs; next/image not configured for them */
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  inputClassName,
} from "@/features/admin/components/ui";
import { secondaryButtonClassName } from "@/features/admin/components/button-styles";
import { QueryErrorBanner } from "@/features/admin/components/query-error-banner";
import { requireRole } from "@/features/auth/queries";
import { getCompanyTimezone } from "@/features/company/queries";
import { CopyLinkButton } from "@/features/hike-photos/components/copy-link-button";
import {
  DeletePhotoButton,
  RevokeShareButton,
} from "@/features/hike-photos/components/delete-photo-button";
import { SendGalleriesButton } from "@/features/hike-photos/components/send-galleries-button";
import {
  listHikePhotosForDate,
  type AdminHikePhotoGroup,
} from "@/features/hike-photos/queries";
import { createClient } from "@/lib/supabase/server";
import { formatDateLabel, getDateInTimezone } from "@/lib/dates";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function HikePhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const profile = await requireRole("admin");
  const params = await searchParams;
  const tz = await getCompanyTimezone(profile.company_id);
  const date =
    params.date && DATE_RE.test(params.date)
      ? params.date
      : getDateInTimezone(tz, 0);

  let groups: AdminHikePhotoGroup[] = [];
  let failed = false;
  try {
    groups = await listHikePhotosForDate(profile.company_id, date);
  } catch {
    failed = true;
  }

  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("auto_send_gallery_on_closeout")
    .eq("id", profile.company_id)
    .maybeSingle();
  const autoSend = company?.auto_send_gallery_on_closeout !== false;

  const activeOwnerCount = new Set(
    groups.flatMap((g) =>
      g.shares.filter((s) => !s.revoked).map((s) => s.customerName)
    )
  ).size;

  return (
    <div>
      <PageHeader
        title="Hike photos"
        description={`${formatDateLabel(date, tz)} — review photos drivers uploaded, copy each owner's gallery link, or delete anything that shouldn't be shared.`}
        action={
          <form method="get" className="flex items-end gap-2">
            <label className="text-sm text-stone-600">
              <span className="sr-only">Date</span>
              <input
                type="date"
                name="date"
                defaultValue={date}
                className={inputClassName}
              />
            </label>
            <button type="submit" className={secondaryButtonClassName}>
              Go
            </button>
          </form>
        }
      />

      {!failed && activeOwnerCount > 0 ? (
        <div className="mb-6 rounded-xl border border-stone-200 bg-white px-4 py-3">
          <p className="text-sm text-stone-600">
            {autoSend
              ? "Gallery texts also go out automatically when a hike is closed out. Use the button to send (or re-check) for this date."
              : "Auto-send is off in Settings — send gallery texts for this date when you are ready."}
          </p>
          <div className="mt-3">
            <SendGalleriesButton date={date} ownerCount={activeOwnerCount} />
          </div>
        </div>
      ) : null}

      {failed ? <QueryErrorBanner /> : null}

      {!failed && !groups.length ? (
        <EmptyState message="No photos for this day yet. Drivers add them from the Today screen during a hike." />
      ) : null}

      <div className="space-y-10">
        {groups.map((group) => (
          <section key={group.hikeId}>
            <h2 className="mb-3 text-lg font-semibold text-stone-900">
              {group.routeName}{" "}
              <span className="text-sm font-normal capitalize text-stone-500">
                {group.period}
              </span>
            </h2>

            {group.photos.length ? (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.photos.map((photo) => (
                  <li key={photo.id}>
                    <Card className="!p-3">
                      {photo.signedUrl ? (
                        <a href={photo.signedUrl} target="_blank" rel="noreferrer">
                          <img
                            src={photo.signedUrl}
                            alt={photo.caption ?? "Hike photo"}
                            loading="lazy"
                            className="aspect-[4/3] w-full rounded-[var(--radius-surface)] object-cover"
                          />
                        </a>
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center rounded-[var(--radius-surface)] bg-stone-100 text-sm text-stone-500">
                          Image unavailable
                        </div>
                      )}
                      {photo.caption ? (
                        <p className="mt-2 text-sm text-stone-800">{photo.caption}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {photo.dogNames.length ? (
                          photo.dogNames.map((name) => (
                            <Badge key={name} tone="green">
                              {name}
                            </Badge>
                          ))
                        ) : (
                          <Badge tone="amber">No dogs tagged</Badge>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <p className="text-xs text-stone-500">
                          {photo.uploadedByName ?? "Driver"} ·{" "}
                          {new Intl.DateTimeFormat("en-US", {
                            timeZone: tz,
                            hour: "numeric",
                            minute: "2-digit",
                          }).format(new Date(photo.createdAt))}
                        </p>
                        <DeletePhotoButton photoId={photo.id} />
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-500">No photos on this hike.</p>
            )}

            {group.shares.length ? (
              <div className="mt-5">
                <h3 className="mb-2 text-sm font-semibold text-stone-700">
                  Owner gallery links
                </h3>
                <ul className="divide-y divide-stone-100 rounded-[var(--radius-card)] surface-glass-strong">
                  {group.shares.map((share) => (
                    <li
                      key={share.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-stone-900">
                          {share.customerName}
                        </p>
                        <p className="truncate text-stone-500">{share.url}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {share.revoked ? (
                          <Badge tone="red">Revoked</Badge>
                        ) : (
                          <>
                            <CopyLinkButton url={share.url} />
                            <RevokeShareButton shareId={share.id} />
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
