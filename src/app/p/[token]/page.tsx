import type { Metadata } from "next";
import { GalleryPhoto } from "@/features/hike-photos/components/gallery-photo";
import { getGalleryByToken } from "@/features/hike-photos/queries";
import { formatDateLabel } from "@/lib/dates";
import { NOINDEX_ROBOTS } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hike photos",
  robots: NOINDEX_ROBOTS,
  referrer: "no-referrer",
};

export default async function PublicPhotoGalleryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getGalleryByToken(token);

  if (result.status !== "ok") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-semibold text-stone-900">
          {result.status === "expired"
            ? "This photo link has expired"
            : "Photos not found"}
        </h1>
        <p className="mt-2 text-stone-600">
          {result.status === "expired"
            ? "Ask your walker to send a fresh link."
            : "Check the link in your text message, or ask your walker for a new one."}
        </p>
      </main>
    );
  }

  const { gallery } = result;
  const dogNames = [...new Set(gallery.photos.flatMap((p) => p.dogNames))];

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-4 py-8">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-stone-500">
          {gallery.companyName}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-stone-900">
          {dogNames.length ? `${dogNames.join(" & ")}'s hike` : "Hike photos"}
        </h1>
        <p className="mt-1 text-stone-600">
          {formatDateLabel(gallery.hikeDate, gallery.timeZone)}
        </p>
        <p className="mt-1 text-sm text-stone-500">
          Every tagged photo from this day&apos;s hikes.
        </p>
      </header>

      {gallery.photos.length ? (
        <ul className="space-y-6">
          {gallery.photos.map((photo) => (
            <GalleryPhoto
              key={photo.id}
              src={photo.url}
              alt={
                photo.caption ??
                `Hike photo of ${photo.dogNames.join(" and ")}`
              }
              caption={photo.caption}
              dogNames={photo.dogNames}
            />
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-stone-300 px-6 py-10 text-center text-stone-500">
          No photos to show right now.
        </p>
      )}

      <p className="mt-10 text-center text-xs text-stone-400">
        Photos are shared privately with you. Please don&apos;t forward this link.
      </p>
    </main>
  );
}
