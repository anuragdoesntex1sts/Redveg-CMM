const MAX_UPLOAD_BYTES = 850 * 1024;
const MAX_IMAGE_DIMENSION = 1800;

/**
 * Re-encode large admin uploads as WebP so the multipart request stays below
 * common reverse-proxy request limits while retaining image dimensions and alpha.
 */
export async function prepareUploadImage(file: File): Promise<File> {
  if (file.size <= MAX_UPLOAD_BYTES) return file;
  if (typeof createImageBitmap !== "function") {
    throw new Error("This browser cannot optimize the image. Please choose an image smaller than 850 KB.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare this image. Please try another file.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const quality = Math.max(0.42, 0.84 - attempt * 0.06);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", quality));
      if (blob && blob.size <= MAX_UPLOAD_BYTES) {
        const name = file.name.replace(/\.[^.]+$/, "") || "image";
        return new File([blob], `${name}.webp`, { type: "image/webp", lastModified: Date.now() });
      }
      if (attempt === 3 || attempt === 6) {
        canvas.width = Math.max(1, Math.round(canvas.width * 0.82));
        canvas.height = Math.max(1, Math.round(canvas.height * 0.82));
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      }
    }
  } finally {
    bitmap.close();
  }

  throw new Error("Could not reduce this image enough for upload. Choose a smaller image and try again.");
}
