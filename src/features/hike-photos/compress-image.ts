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

type ResizeOptions = ImageBitmapOptions & {
  resizeWidth?: number;
  resizeHeight?: number;
  resizeQuality?: "pixelated" | "low" | "medium" | "high";
};

/** JPEG/PNG pixel size from the file header, without decoding the bitmap. */
export function imageSizeFromHeader(
  bytes: Uint8Array
): { width: number; height: number } | null {
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = bytes[i + 1];
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      return { height: view.getUint16(i + 5), width: view.getUint16(i + 7) };
    }
    const length = (bytes[i + 2] << 8) + bytes[i + 3];
    if (length < 2) break;
    i += 2 + length;
  }
  return null;
}

function downsampleOptions(
  size: { width: number; height: number } | null
): ResizeOptions {
  const options: ResizeOptions = { imageOrientation: "from-image" };
  if (!size || size.width < 1 || size.height < 1) return options;
  const longEdge = Math.max(size.width, size.height);
  if (longEdge <= PHOTO_MAX_DIMENSION) return options;
  const scale = PHOTO_MAX_DIMENSION / longEdge;
  options.resizeWidth = Math.max(1, Math.round(size.width * scale));
  options.resizeHeight = Math.max(1, Math.round(size.height * scale));
  options.resizeQuality = "medium";
  return options;
}

/** Downsample during decode so a phone photo is not fully expanded first. */
async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      const header = new Uint8Array(await file.slice(0, 256 * 1024).arrayBuffer());
      const bitmap = await createImageBitmap(
        file,
        downsampleOptions(imageSizeFromHeader(header))
      );
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

/** Resize to the long-edge cap and re-encode as JPEG. */
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
