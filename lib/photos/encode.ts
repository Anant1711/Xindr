// Browser only. Re-encodes a photo before upload:
// - drawing to a canvas and exporting drops ALL metadata (EXIF, GPS, camera, timestamps);
// - EXIF orientation is applied first, so the image stays upright;
// - the long side is capped and the result compressed to stay under the bucket's 1 MB limit.

export const MAX_SIDE = 1080;
/** Cards and avatars show photos at most ~300 px wide; 480 covers 1.5x screens. */
export const THUMB_SIDE = 480;
const MAX_BYTES = 950 * 1024;
const MAX_INPUT_BYTES = 30 * 1024 * 1024;

export type EncodedPhoto = { blob: Blob; width: number; height: number };
export type EncodedPhotoSet = EncodedPhoto & { thumb: Blob };

export class PhotoError extends Error {}

export function fitWithin(width: number, height: number, maxSide = MAX_SIDE) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function toJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
}

async function render(
  bitmap: ImageBitmap,
  maxSide: number,
): Promise<EncodedPhoto> {
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxSide);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new PhotoError("Couldn't process the photo.");
  ctx.fillStyle = "#ffffff"; // transparent PNGs become white, not black
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);

  for (const quality of [0.82, 0.72, 0.6]) {
    const blob = await toJpeg(canvas, quality);
    if (blob && blob.size <= MAX_BYTES) return { blob, width, height };
  }
  throw new PhotoError(
    "Couldn't make the photo small enough. Try another one.",
  );
}

/** The upload (max 1080 px) plus a small thumbnail (max 480 px), both metadata-free JPEGs. */
export async function encodePhoto(file: File): Promise<EncodedPhotoSet> {
  if (!file.type.startsWith("image/")) throw new PhotoError("Choose a photo.");
  if (file.size > MAX_INPUT_BYTES)
    throw new PhotoError("That photo is too large.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // e.g. HEIC on browsers that cannot decode it
    throw new PhotoError(
      "This photo format isn't supported. Try a JPEG or PNG.",
    );
  }
  try {
    const full = await render(bitmap, MAX_SIDE);
    const thumb = await render(bitmap, THUMB_SIDE);
    return { ...full, thumb: thumb.blob };
  } finally {
    bitmap.close();
  }
}
