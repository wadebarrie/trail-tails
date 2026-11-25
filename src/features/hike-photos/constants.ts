export const HIKE_PHOTOS_BUCKET = "hike-photos";

/** Client-side compression targets (issue #113). */
export const PHOTO_MAX_DIMENSION = 1600;
export const PHOTO_JPEG_QUALITY = 0.8;

/** Matches the bucket file_size_limit (5 MB). */
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export const PHOTO_CAPTION_MAX_LENGTH = 200;
export const PHOTO_MAX_DOG_TAGS = 50;

/** Signed image URLs on the public gallery live this long (seconds). */
export const GALLERY_IMAGE_URL_TTL_SECONDS = 60 * 60;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function buildPhotoStoragePath(
  companyId: string,
  hikeId: string,
  photoId: string
): string {
  return `${companyId}/${hikeId}/${photoId}.jpg`;
}
