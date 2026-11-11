"use client";

import { useEffect, useRef, useState } from "react";

// Matches the real card exactly: components/product/product-tile.tsx uses
// `aspect-[4/3]` + `object-contain p-4`. Change this if that class changes.
const ASPECT_W = 4;
const ASPECT_H = 3;
const CANVAS_W = 420;
const CANVAS_H = (CANVAS_W * ASPECT_H) / ASPECT_W;
const EXPORT_W = 1200;
const EXPORT_H = (EXPORT_W * ASPECT_H) / ASPECT_W;
const PREVIEW_W = 220;
const PREVIEW_H = (PREVIEW_W * ASPECT_H) / ASPECT_W;
const CARD_PAD_RATIO = 16 / 300; // p-4 (16px) on a ~300px-wide real card, applied proportionally

/**
 * Crop/pan/zoom editor at the storefront card's own aspect ratio (4:3), output
 * matches exactly what product-tile.tsx shows (object-contain, p-4 padded) —
 * so what the operator sees here is what the customer sees, not a guess.
 */
export function ImageCropModal({
  file,
  productTitle,
  queueRemaining = 0,
  onCancel,
  onSave,
}: {
  file: File;
  productTitle?: string;
  /** Images still waiting after this one, for "2 more after this" context. */
  queueRemaining?: number;
  onCancel: () => void;
  onSave: (blob: Blob) => void | Promise<void>;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // pan, in on-screen px
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => setImg(el);
    el.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Base scale: image fits entirely inside the frame at zoom=1 (same as the
  // card's object-contain — nothing is cut off until the operator zooms in).
  function baseScale(image: HTMLImageElement) {
    return Math.min(CANVAS_W / image.width, CANVAS_H / image.height);
  }

  function clampOffset(image: HTMLImageElement, z: number, o: { x: number; y: number }) {
    const scale = baseScale(image) * z;
    const w = image.width * scale;
    const h = image.height * scale;
    const maxX = Math.max(0, (w - CANVAS_W) / 2);
    const maxY = Math.max(0, (h - CANVAS_H) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, o.x)), y: Math.min(maxY, Math.max(-maxY, o.y)) };
  }

  function draw(image: HTMLImageElement, z: number, o: { x: number; y: number }) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    // Checkerboard so transparent product cutouts are visible while editing.
    const tile = 10;
    for (let y = 0; y < CANVAS_H; y += tile) {
      for (let x = 0; x < CANVAS_W; x += tile) {
        ctx.fillStyle = (x / tile + y / tile) % 2 === 0 ? "#f3f4f6" : "#e5e7eb";
        ctx.fillRect(x, y, tile, tile);
      }
    }
    const scale = baseScale(image) * z;
    const w = image.width * scale;
    const h = image.height * scale;
    const x = CANVAS_W / 2 - w / 2 + o.x;
    const y = CANVAS_H / 2 - h / 2 + o.y;
    ctx.drawImage(image, x, y, w, h);

    // Card preview: the same frame on a white card background with the card's
    // own padding, matching product-tile's object-contain + p-4 exactly.
    const preview = previewCanvasRef.current;
    const pctx = preview?.getContext("2d");
    if (preview && pctx) {
      pctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
      pctx.fillStyle = "#ffffff";
      pctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);
      const pad = PREVIEW_W * CARD_PAD_RATIO;
      const f = (PREVIEW_W - pad * 2) / CANVAS_W;
      pctx.drawImage(image, pad + x * f, pad + y * f, w * f, h * f);
    }
  }

  useEffect(() => {
    if (img) draw(img, zoom, offset);
  }, [img, zoom, offset]);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current || !img) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setOffset(clampOffset(img, zoom, { x: dragRef.current.ox + dx, y: dragRef.current.oy + dy }));
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  function setZoomClamped(z: number) {
    if (!img) return;
    const next = Math.min(4, Math.max(1, z));
    setZoom(next);
    setOffset((o) => clampOffset(img, next, o));
  }

  async function save() {
    if (!img) return;
    setSaving(true);
    try {
      const out = document.createElement("canvas");
      out.width = EXPORT_W;
      out.height = EXPORT_H;
      const ctx = out.getContext("2d");
      if (!ctx) return;
      const ratio = EXPORT_W / CANVAS_W;
      const scale = baseScale(img) * zoom * ratio;
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, EXPORT_W / 2 - w / 2 + offset.x * ratio, EXPORT_H / 2 - h / 2 + offset.y * ratio, w, h);
      const blob: Blob | null = await new Promise((resolve) => out.toBlob(resolve, "image/png"));
      if (blob) await onSave(blob);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Position the image</h2>
            {queueRemaining > 0 ? <p className="text-xs text-gray-500">{queueRemaining} more after this one</p> : null}
          </div>
          <button type="button" onClick={onCancel} className="text-xs font-semibold text-gray-500 hover:text-gray-900">
            Skip
          </button>
        </div>

        <div className="mt-4 grid gap-6 sm:grid-cols-[420px_1fr]">
          <div>
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              className="touch-none cursor-move rounded-md border border-gray-300"
            />
            <label className="mt-3 flex items-center gap-3 text-xs font-medium text-gray-600">
              Zoom
              <input
                type="range"
                min={1}
                max={4}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoomClamped(Number(e.target.value))}
                className="flex-1"
              />
            </label>
            <p className="mt-1 text-[11px] text-gray-400">Drag the image to reposition it. The frame shown is exactly the card's image area (4:3).</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Live preview — storefront card</p>
            <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm" style={{ width: PREVIEW_W }}>
              <canvas ref={previewCanvasRef} width={PREVIEW_W} height={PREVIEW_H} className="block w-full" />
              <div className="space-y-1 p-2.5">
                <p className="truncate text-[12px] font-semibold text-gray-900">{productTitle || "Product title"}</p>
                <p className="text-[12px] font-bold text-gray-900">₹0.00</p>
              </div>
            </div>
            <button
              type="button"
              onClick={save}
              disabled={saving || !img}
              className="mt-5 w-full rounded bg-gray-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Use this image"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
