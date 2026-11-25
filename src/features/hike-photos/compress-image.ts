import {
  PHOTO_JPEG_QUALITY,
  PHOTO_MAX_DIMENSION,
} from "@/features/hike-photos/constants";

type Decoded = {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};

async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // fall through to <img> decoding
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("This photo format isn't supported. Try a JPEG or PNG.");
  }
}

/** Resize to max 1600px on the long edge and re-encode as JPEG @ 0.8. */
export async function compressImageForUpload(file: File): Promise<Blob> {
  const decoded = await decode(file);
  try {
    const scale = Math.min(
      1,
      PHOTO_MAX_DIMENSION / Math.max(decoded.width, decoded.height)
    );
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process this photo.");

    // JPEG has no alpha — paint white under transparent PNGs.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(decoded.source, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", PHOTO_JPEG_QUALITY)
    );
    if (!blob) throw new Error("Could not process this photo.");
    return blob;
  } finally {
    decoded.release();
  }
}
