"use client";

import { useRef, useState } from "react";
import { Trash2, Star, ImagePlus } from "lucide-react";
import { LibraryButton, uploadImages } from "../image-uploader";
import { ImageCropModal } from "../image-crop-modal";

/** Gallery manager. Every change saves immediately; the first image is the main one. */
export function ProductImages({
  productId,
  initialImages,
  initialThumbnail,
  productTitle,
}: {
  productId: string;
  initialImages: string[];
  initialThumbnail: string | null;
  productTitle?: string;
}) {
  const [images, setImages] = useState(initialImages);
  const [thumbnail, setThumbnail] = useState(initialThumbnail || initialImages[0] || null);
  const [error, setError] = useState("");
  const [queue, setQueue] = useState<File[]>([]); // files still waiting to be cropped
  const [cropping, setCropping] = useState(false);
  const cropInput = useRef<HTMLInputElement>(null);
  const cropFile = queue[0] ?? null;

  async function save(nextImages: string[], nextThumb: string | null) {
    setError("");
    const res = await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images: nextImages, thumbnail: nextThumb }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not save images");
      return;
    }
    setImages(nextImages);
    setThumbnail(nextThumb);
  }

  const add = (urls: string[]) => {
    const next = [...images, ...urls.filter((u) => !images.includes(u))];
    return save(next, thumbnail || next[0] || null);
  };
  const remove = (url: string) => {
    const next = images.filter((u) => u !== url);
    return save(next, thumbnail === url ? next[0] || null : thumbnail);
  };

  async function uploadCropped(blob: Blob) {
    setCropping(true);
    setError("");
    try {
      const file = new File([blob], "product-image.png", { type: "image/png" });
      const [url] = await uploadImages([file]);
      await add([url]);
      setQueue((q) => q.slice(1)); // next file in the queue, if any
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setCropping(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Product images</h3>
          <p className="text-xs text-gray-500">PNG, JPEG or WebP, up to 5 MB each. The starred image is the main one customers see first.</p>
        </div>
        <div className="flex items-start gap-2">
          <LibraryButton onPicked={add} />
          <input
            ref={cropInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) setQueue((q) => [...q, ...files]);
              if (cropInput.current) cropInput.current.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => cropInput.current?.click()}
            className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Upload images
          </button>
        </div>
      </div>
      {error ? <p className="mt-3 text-xs text-rose-600">{error}</p> : null}
      {images.length === 0 ? (
        <p className="py-8 text-center text-xs text-gray-400">No images yet. Customers see a placeholder.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((url) => (
            <div key={url} className="group relative overflow-hidden rounded-md border border-gray-200 bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-square w-full object-contain" />
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-white/90 px-2 py-1">
                <button
                  type="button"
                  onClick={() => save(images, url)}
                  aria-label="Make main image"
                  className={thumbnail === url ? "text-amber-500" : "text-gray-400 hover:text-amber-500"}
                >
                  <Star className="h-4 w-4" fill={thumbnail === url ? "currentColor" : "none"} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(url)}
                  aria-label="Remove image"
                  className="text-gray-400 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {cropFile ? (
        <ImageCropModal
          file={cropFile}
          productTitle={productTitle}
          queueRemaining={queue.length - 1}
          onCancel={() => setQueue((q) => q.slice(1))}
          onSave={uploadCropped}
        />
      ) : null}
      {cropping ? <p className="mt-2 text-xs text-gray-500">Uploading…</p> : null}
    </div>
  );
}
