import type { Photo, PhotoPair } from "./types";

const THUMB = { maxWidth: 400, targetBytes: 28_000 };
const FULL = { maxWidth: 1080, targetBytes: 130_000 };
const MIN_QUALITY = 0.45;

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // `from-image` applies EXIF rotation, so phone photos are not sideways
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Encode at the highest quality that fits the byte budget.
 * Tries WebP first. Safari cannot encode WebP from a canvas and silently
 * returns PNG, so in that case we fall back to JPEG.
 */
async function encode(
  canvas: HTMLCanvasElement,
  targetBytes: number,
): Promise<{ blob: Blob; ext: "webp" | "jpg" }> {
  let type = "image/webp";
  let ext: "webp" | "jpg" = "webp";

  const probe = await toBlob(canvas, type, 0.8);
  if (!probe || probe.type !== "image/webp") {
    type = "image/jpeg";
    ext = "jpg";
  }

  let quality = 0.82;
  let blob = (await toBlob(canvas, type, quality)) as Blob;
  while (blob.size > targetBytes && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - 0.08);
    blob = (await toBlob(canvas, type, quality)) as Blob;
  }
  return { blob, ext };
}

async function variant(
  source: ImageBitmap | HTMLImageElement,
  spec: { maxWidth: number; targetBytes: number },
): Promise<Photo> {
  const srcW = "naturalWidth" in source ? source.naturalWidth : source.width;
  const srcH = "naturalHeight" in source ? source.naturalHeight : source.height;
  const scale = Math.min(1, spec.maxWidth / srcW);
  const width = Math.round(srcW * scale);
  const height = Math.round(srcH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);

  const { blob, ext } = await encode(canvas, spec.targetBytes);
  return { blob, type: blob.type, ext, width, height };
}

/** One camera photo in, two small files out: 400px thumb and 1080px full. */
export async function compressPhoto(file: File): Promise<PhotoPair> {
  const source = await decode(file);
  try {
    const thumb = await variant(source, THUMB);
    const full = await variant(source, FULL);
    return { thumb, full };
  } finally {
    if ("close" in source) source.close();
  }
}

/** Short content hash, so identical files share a name and can be cached forever. */
export async function shortHash(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest).slice(0, 8))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;
