export type CompressOptions = {
  /** Max width or height in pixels (keeps aspect ratio). */
  maxDimension?: number;
  /** JPEG quality 0..1 */
  quality?: number;
  /** Target max bytes (best effort). */
  maxBytes?: number;
};

async function fileToImageBitmap(file: File): Promise<ImageBitmap> {
  // Prefer createImageBitmap for speed + memory.
  if (typeof createImageBitmap === "function") {
    return await createImageBitmap(file);
  }

  // Fallback for older browsers.
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Failed to load image"));
    el.src = dataUrl;
  });

  return await createImageBitmap(img);
}

function computeTargetSize(width: number, height: number, maxDimension: number) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }
  const scale = Math.min(maxDimension / width, maxDimension / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Failed to encode JPEG"));
      },
      "image/jpeg",
      quality
    );
  });
}

/**
 * Downscale + convert to JPEG to drastically reduce size (best effort).
 * Returns the original file if it is already small enough.
 */
export async function compressImageFileToJpeg(file: File, opts: CompressOptions = {}): Promise<File> {
  const maxDimension = opts.maxDimension ?? 2200;
  const maxBytes = opts.maxBytes ?? 2_500_000;
  let quality = opts.quality ?? 0.82;

  // If already reasonable size and already JPEG, keep.
  if (file.size <= maxBytes && (file.type === "image/jpeg" || file.type === "image/jpg")) {
    return file;
  }

  const bitmap = await fileToImageBitmap(file);
  const target = computeTargetSize(bitmap.width, bitmap.height, maxDimension);

  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.drawImage(bitmap, 0, 0, target.width, target.height);

  // Try a few times to get under maxBytes.
  let blob = await canvasToJpegBlob(canvas, quality);
  for (let i = 0; i < 4 && blob.size > maxBytes; i++) {
    quality = Math.max(0.55, quality - 0.12);
    blob = await canvasToJpegBlob(canvas, quality);
  }

  const baseName = file.name.replace(/\.[^.]+$/, "");
  const outName = `${baseName}.jpg`;
  return new File([blob], outName, { type: "image/jpeg" });
}
