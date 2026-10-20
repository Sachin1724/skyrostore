"use client";

import { useState } from "react";
import { Trash2, Star } from "lucide-react";
import { UploadButton } from "../image-uploader";

/** Gallery manager. Every change saves immediately; the first image is the main one. */
export function ProductImages({
  productId,
  initialImages,
  initialThumbnail,
}: {
  productId: string;
  initialImages: string[];
  initialThumbnail: string | null;
}) {
  const [images, setImages] = useState(initialImages);
  const [thumbnail, setThumbnail] = useState(initialThumbnail || initialImages[0] || null);
  const [error, setError] = useState("");

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

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Product images</h3>
          <p className="text-xs text-gray-500">PNG, JPEG or WebP, up to 5 MB each. The starred image is the main one customers see first.</p>
        </div>
        <UploadButton onUploaded={add} />
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
    </div>
  );
}
