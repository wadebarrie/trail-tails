import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { one } from "@/lib/supabase/relations";
import {
  GALLERY_IMAGE_URL_TTL_SECONDS,
  HIKE_PHOTOS_BUCKET,
} from "@/features/hike-photos/constants";
import { galleryTextStatusForDate } from "@/features/hike-photos/send-gallery-sms";
import {
  buildGalleryUrl,
  isValidShareTokenShape,
} from "@/features/hike-photos/share";

export type AdminHikePhoto = {
  id: string;
  storagePath: string;
  caption: string | null;
  createdAt: string;
  uploadedByName: string | null;
  dogNames: string[];
  signedUrl: string | null;
};

export type AdminHikePhotoShare = {
  id: string;
  customerId: string;
  customerName: string;
  token: string;
  url: string;
  expiresAt: string;
  revoked: boolean;
  galleryText: {
    state: "sent" | "unsent";
    sentAt: string | null;
    via: "gallery" | "dropoff" | null;
  };
};

export type AdminHikePhotoGroup = {
  hikeId: string;
  routeName: string;
  period: string;
  photos: AdminHikePhoto[];
  shares: AdminHikePhotoShare[];
};

type NameRow = { name: string } | { name: string }[] | null;

/** Admin: photos + share links for every hike on a date, grouped by hike. */
export async function listHikePhotosForDate(
  companyId: string,
  date: string
): Promise<{
  groups: AdminHikePhotoGroup[];
  unsentOwners: number;
  liveShares: number;
}> {
  const supabase = await createClient();

  const { data: hikes, error: hikesError } = await supabase
    .from("hikes")
    .select("id, period, routes ( name )")
    .eq("company_id", companyId)
    .eq("date", date);
  if (hikesError) throw new Error(hikesError.message);

  const hikeIds = (hikes ?? []).map((h) => h.id as string);
  if (!hikeIds.length) return { groups: [], unsentOwners: 0, liveShares: 0 };

  const [photosResult, sharesResult] = await Promise.all([
    supabase
      .from("hike_photos")
      .select(
        "id, hike_id, storage_path, caption, created_at, profiles ( full_name ), hike_photo_dogs ( dogs ( name ) )"
      )
      .eq("company_id", companyId)
      .in("hike_id", hikeIds)
      .order("created_at", { ascending: true }),
    supabase
      .from("hike_photo_shares")
      .select(
        "id, hike_id, customer_id, token, expires_at, revoked_at, customers ( owner_name )"
      )
      .eq("company_id", companyId)
      .in("hike_id", hikeIds),
  ]);
  if (photosResult.error) throw new Error(photosResult.error.message);
  if (sharesResult.error) throw new Error(sharesResult.error.message);

  const photoRows = photosResult.data ?? [];
  const signedByPath = new Map<string, string>();
  if (photoRows.length) {
    const { data: signed } = await supabase.storage
      .from(HIKE_PHOTOS_BUCKET)
      .createSignedUrls(
        photoRows.map((p) => p.storage_path as string),
        GALLERY_IMAGE_URL_TTL_SECONDS
      );
    for (const entry of signed ?? []) {
      if (entry.path && entry.signedUrl) {
        signedByPath.set(entry.path, entry.signedUrl);
      }
    }
  }

  const groups = (hikes ?? [])
    .map((hike) => {
      const route = one(hike.routes as NameRow);
      const photos: AdminHikePhoto[] = photoRows
        .filter((p) => p.hike_id === hike.id)
        .map((p) => {
          const uploader = one(
            p.profiles as { full_name: string } | { full_name: string }[] | null
          );
          const tags = (p.hike_photo_dogs ?? []) as { dogs: NameRow }[];
          return {
            id: p.id as string,
            storagePath: p.storage_path as string,
            caption: (p.caption as string | null) ?? null,
            createdAt: p.created_at as string,
            uploadedByName: uploader?.full_name ?? null,
            dogNames: tags
              .map((t) => one(t.dogs)?.name)
              .filter((n): n is string => Boolean(n)),
            signedUrl: signedByPath.get(p.storage_path as string) ?? null,
          };
        });

      const shares: AdminHikePhotoShare[] = (sharesResult.data ?? [])
        .filter((s) => s.hike_id === hike.id)
        .map((s) => {
          const customer = one(
            s.customers as
              | { owner_name: string }
              | { owner_name: string }[]
              | null
          );
          return {
            id: s.id as string,
            customerId: s.customer_id as string,
            customerName: customer?.owner_name ?? "Customer",
            token: s.token as string,
            url: buildGalleryUrl(s.token as string),
            expiresAt: s.expires_at as string,
            revoked: Boolean(s.revoked_at),
            galleryText: { state: "unsent" as const, sentAt: null, via: null },
          };
        })
        .sort((a, b) => a.customerName.localeCompare(b.customerName));

      return {
        hikeId: hike.id as string,
        routeName: route?.name ?? "Route",
        period: hike.period as string,
        photos,
        shares,
      };
    })
    .filter((g) => g.photos.length > 0 || g.shares.length > 0)
    .sort((a, b) => a.routeName.localeCompare(b.routeName));

  const shareRefs = groups.flatMap((group) =>
    group.shares.map((share) => ({
      customerId: share.customerId,
      token: share.token,
    }))
  );
  let textStatus = new Map<
    string,
    { state: "sent" | "unsent"; sentAt: string | null; via: "gallery" | "dropoff" | null }
  >();
  try {
    textStatus = await galleryTextStatusForDate(companyId, date, shareRefs);
  } catch {
    textStatus = new Map();
  }

  const now = Date.now();
  let unsentOwners = 0;
  let liveShares = 0;
  const seenUnsent = new Set<string>();
  for (const group of groups) {
    for (const share of group.shares) {
      const status = textStatus.get(share.customerId);
      if (status) share.galleryText = status;
      if (share.revoked || new Date(share.expiresAt).getTime() < now) continue;
      liveShares += 1;
      if (share.galleryText.state === "unsent" && !seenUnsent.has(share.customerId)) {
        seenUnsent.add(share.customerId);
        unsentOwners += 1;
      }
    }
  }

  return { groups, unsentOwners, liveShares };
}

export type GalleryPhoto = {
  id: string;
  caption: string | null;
  createdAt: string;
  url: string;
  dogNames: string[];
};

export type GalleryView = {
  companyName: string;
  timeZone: string;
  hikeDate: string;
  customerName: string;
  photos: GalleryPhoto[];
};

export type GalleryResult =
  | { status: "ok"; gallery: GalleryView }
  | { status: "not_found" }
  | { status: "expired" };

/** Public: resolve a share token (service role — no login). */
export async function getGalleryByToken(token: string): Promise<GalleryResult> {
  if (!isValidShareTokenShape(token)) return { status: "not_found" };

  const service = createServiceClient();
  const { data: share } = await service
    .from("hike_photo_shares")
    .select("id, company_id, hike_id, customer_id, expires_at, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (!share || share.revoked_at) return { status: "not_found" };
  if (new Date(share.expires_at as string).getTime() < Date.now()) {
    return { status: "expired" };
  }

  const [hikeResult, companyResult, customerResult, dogsResult] =
    await Promise.all([
      service.from("hikes").select("date").eq("id", share.hike_id).maybeSingle(),
      service
        .from("companies")
        .select("name, timezone")
        .eq("id", share.company_id)
        .maybeSingle(),
      service
        .from("customers")
        .select("owner_name")
        .eq("id", share.customer_id)
        .maybeSingle(),
      service
        .from("dogs")
        .select("id, name")
        .eq("customer_id", share.customer_id)
        .eq("company_id", share.company_id),
    ]);

  if (!hikeResult.data || !companyResult.data) return { status: "not_found" };

  const hikeDate = hikeResult.data.date as string;
  const { data: dayHikes } = await service
    .from("hikes")
    .select("id")
    .eq("company_id", share.company_id)
    .eq("date", hikeDate);
  const dayHikeIds = (dayHikes ?? []).map((hike) => hike.id as string);
  if (!dayHikeIds.length) dayHikeIds.push(share.hike_id as string);

  const dogs = dogsResult.data ?? [];
  const dogNameById = new Map(dogs.map((d) => [d.id as string, d.name as string]));

  const photoMap = new Map<
    string,
    { id: string; caption: string | null; createdAt: string; path: string }
  >();
  const tagsByPhoto = new Map<string, Set<string>>();

  if (dogs.length) {
    const { data: tags } = await service
      .from("hike_photo_dogs")
      .select(
        "dog_id, hike_photos!inner ( id, hike_id, storage_path, caption, created_at )"
      )
      .in("dog_id", [...dogNameById.keys()])
      .in("hike_photos.hike_id", dayHikeIds);

    for (const tag of tags ?? []) {
      const photo = one(
        tag.hike_photos as
          | {
              id: string;
              storage_path: string;
              caption: string | null;
              created_at: string;
            }
          | {
              id: string;
              storage_path: string;
              caption: string | null;
              created_at: string;
            }[]
          | null
      );
      if (!photo) continue;
      photoMap.set(photo.id, {
        id: photo.id,
        caption: photo.caption,
        createdAt: photo.created_at,
        path: photo.storage_path,
      });
      const set = tagsByPhoto.get(photo.id) ?? new Set<string>();
      const dogName = dogNameById.get(tag.dog_id as string);
      if (dogName) set.add(dogName);
      tagsByPhoto.set(photo.id, set);
    }
  }

  const ordered = [...photoMap.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );

  const urlByPath = new Map<string, string>();
  if (ordered.length) {
    const { data: signed } = await service.storage
      .from(HIKE_PHOTOS_BUCKET)
      .createSignedUrls(
        ordered.map((p) => p.path),
        GALLERY_IMAGE_URL_TTL_SECONDS
      );
    for (const entry of signed ?? []) {
      if (entry.path && entry.signedUrl) urlByPath.set(entry.path, entry.signedUrl);
    }
  }

  return {
    status: "ok",
    gallery: {
      companyName: companyResult.data.name as string,
      timeZone: (companyResult.data.timezone as string) ?? "America/Los_Angeles",
      hikeDate,
      customerName: (customerResult.data?.owner_name as string) ?? "",
      photos: ordered
        .map((p) => ({
          id: p.id,
          caption: p.caption,
          createdAt: p.createdAt,
          url: urlByPath.get(p.path) ?? "",
          dogNames: [...(tagsByPhoto.get(p.id) ?? [])].sort(),
        }))
        .filter((p) => p.url),
    },
  };
}

/**
 * Gallery URL for SMS. Shares are only minted when one of the owner's dogs is
 * tagged in an upload, so a hit means photos exist. Returns null when there is
 * no share or it is revoked/expired.
 */
export async function getHikePhotoShareUrlForCustomer(
  hikeId: string,
  customerId: string
): Promise<string | null> {
  const service = createServiceClient();
  const { data: share } = await service
    .from("hike_photo_shares")
    .select("token, expires_at, revoked_at")
    .eq("hike_id", hikeId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (!share || share.revoked_at) return null;
  if (new Date(share.expires_at as string).getTime() < Date.now()) return null;

  return buildGalleryUrl(share.token as string);
}

/** Owners with a live gallery link on routes that are not closed out yet. */
export async function countTaggedGalleryOwners(
  companyId: string,
  start: string,
  end: string
): Promise<number> {
  const supabase = await createClient();
  const { data: hikes, error } = await supabase
    .from("hikes")
    .select("id")
    .eq("company_id", companyId)
    .gte("date", start)
    .lte("date", end)
    .neq("status", "completed");
  if (error || !hikes?.length) return 0;

  const customers = new Set<string>();
  const ids = hikes.map((hike) => hike.id as string);
  for (let i = 0; i < ids.length; i += 80) {
    const { data: shares } = await supabase
      .from("hike_photo_shares")
      .select("customer_id")
      .eq("company_id", companyId)
      .in("hike_id", ids.slice(i, i + 80))
      .is("revoked_at", null);
    for (const share of shares ?? []) {
      customers.add(share.customer_id as string);
    }
  }
  return customers.size;
}
