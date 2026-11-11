"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, X, ZoomIn } from "lucide-react";
import { ProductMediaFallback } from "@/components/product/product-media-fallback";

interface ProductGalleryProps {
  title: string;
  images: string[];
  thumbnail: string | null;
  videoUrl?: string | null;
  componentType?: string;
  category?: string;
  discountPercent?: number | null;
}

export function ProductGallery({
  title,
  images,
  thumbnail,
  videoUrl = null,
  componentType,
  category,
  discountPercent,
}: ProductGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const zoomDialogRef = useRef<HTMLDialogElement>(null);

  // Consolidate images array (photos only, fallback to thumbnail)
  const displayImages = images.length > 0 ? images : thumbnail ? [thumbnail] : [];
  const currentImage = displayImages[selectedIdx] ?? null;

  const handleStep = useCallback((delta: number) => {
    if (displayImages.length <= 1) return;
    setSelectedIdx((prev) => (prev + delta + displayImages.length) % displayImages.length);
  }, [displayImages.length]);

  useEffect(() => {
    const dialog = zoomDialogRef.current;
    if (!dialog) return;
    if (isZoomOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isZoomOpen && dialog.open) {
      dialog.close();
    }
  }, [isZoomOpen]);

  return (
    <div
      role="region"
      aria-label="Product visual media"
      tabIndex={displayImages.length > 1 ? 0 : -1}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") handleStep(1);
        if (e.key === "ArrowLeft") handleStep(-1);
      }}
      className="lg:sticky lg:top-[125px] lg:self-start"
    >
      <div className={`flex flex-col-reverse gap-4 ${displayImages.length > 1 || videoUrl ? "lg:grid lg:grid-cols-[82px_minmax(0,1fr)]" : ""}`}>
        {/* Thumbnail Strip (Vertical on Desktop, Horizontal on Mobile) */}
        {displayImages.length > 1 || videoUrl ? (
          <ul
            aria-label="Photo thumbnails"
            className="flex gap-2.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:pb-0 [scrollbar-width:none]"
          >
            {displayImages.map((src, i) => (
              <li key={src} className="shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIdx(i);
                    setIsVideoActive(false);
                  }}
                  aria-label={`View photo ${i + 1} of ${displayImages.length}`}
                  aria-pressed={!isVideoActive && selectedIdx === i}
                  className={`relative block h-20 w-20 rounded-md border-2 bg-white transition-all ${
                    !isVideoActive && selectedIdx === i
                      ? "border-brand ring-2 ring-brand/20"
                      : "border-border hover:border-border-strong"
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-contain p-2"
                  />
                </button>
              </li>
            ))}

            {videoUrl ? (
              <li className="shrink-0">
                <button
                  type="button"
                  onClick={() => setIsVideoActive(true)}
                  aria-label="Watch product video demonstration"
                  aria-pressed={isVideoActive}
                  className={`relative flex h-20 w-20 flex-col items-center justify-center rounded-md border-2 bg-navy text-white transition-all ${
                    isVideoActive ? "border-brand ring-2 ring-brand/20" : "border-border hover:border-border-strong"
                  }`}
                >
                  <Play className="h-6 w-6 text-brand-cyan" fill="currentColor" aria-hidden />
                  <span className="mt-1 text-[13px] font-bold">Video</span>
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}

        {/* Main Viewport */}
        <div className="relative aspect-[4/3] max-h-[560px] w-full overflow-hidden card">
          {isVideoActive && videoUrl ? (
            <div className="relative h-full w-full bg-black">
              <iframe
                src={videoUrl}
                title={`${title} demonstration video`}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <button
                type="button"
                onClick={() => setIsVideoActive(false)}
                className="absolute right-3 top-3 flex h-8 items-center gap-1.5 rounded bg-navy/80 px-2.5 text-[13px] font-semibold text-white hover:bg-navy"
              >
                <X className="h-4 w-4" aria-hidden /> Return to Photos
              </button>
            </div>
          ) : currentImage ? (
            <>
              <div key={currentImage} className="relative h-full w-full">
                <Image
                  src={currentImage}
                  alt={title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-contain p-6 transition-transform duration-300 hover:scale-[1.02]"
                />
              </div>

              {discountPercent ? (
                <span className="absolute left-3 top-3 rounded bg-error px-2.5 py-1 text-[13px] font-extrabold uppercase tracking-wide text-white">
                  -{discountPercent}%
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                aria-label="Zoom photo"
                className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white text-navy transition-colors hover:bg-brand hover:text-white"
              >
                <ZoomIn className="h-4 w-4" strokeWidth={2} aria-hidden />
              </button>

              {displayImages.length > 1 ? (
                <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 opacity-0 transition-opacity hover:opacity-100 sm:opacity-75">
                  <button
                    type="button"
                    onClick={() => handleStep(-1)}
                    aria-label="Previous image"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-navy shadow transition-transform hover:scale-105"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep(1)}
                    aria-label="Next image"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-navy shadow transition-transform hover:scale-105"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <ProductMediaFallback componentType={componentType} category={category} title={title} />
          )}
        </div>
      </div>

      {/* Full-Screen Zoom Modal */}
      <dialog
        ref={zoomDialogRef}
        onClose={() => setIsZoomOpen(false)}
        onClick={(e) => {
          if (e.target === zoomDialogRef.current) setIsZoomOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") handleStep(1);
          if (e.key === "ArrowLeft") handleStep(-1);
          if (e.key === "Escape") setIsZoomOpen(false);
        }}
        aria-label={`${title} high-resolution photograph`}
        className="pop m-auto h-[min(94vh,960px)] w-[min(94vw,960px)] max-w-none overscroll-contain card p-0 shadow-2xl backdrop:bg-navy/75"
      >
        <div className="relative flex h-full w-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <span className="text-[14px] font-bold text-navy truncate pr-4">
              {title} {displayImages.length > 1 ? `(${selectedIdx + 1} of ${displayImages.length})` : ""}
            </span>
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              aria-label="Close high-resolution zoom"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-navy transition-colors hover:bg-surface-soft"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="relative flex-1 bg-surface-soft p-6">
            {currentImage ? (
              <Image
                src={currentImage}
                alt={title}
                fill
                sizes="960px"
                className="object-contain p-4"
              />
            ) : null}

            {displayImages.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => handleStep(-1)}
                  aria-label="Previous photo"
                  className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-navy shadow-md transition-transform hover:scale-105"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => handleStep(1)}
                  aria-label="Next photo"
                  className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-navy shadow-md transition-transform hover:scale-105"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </dialog>
    </div>
  );
}

