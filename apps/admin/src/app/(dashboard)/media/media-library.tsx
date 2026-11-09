"use client";

import { useCallback, useEffect, useState } from "react";
import { UploadButton, uploadImages } from "../products/image-uploader";
import { useConfirm } from "@/components/ui/confirm-dialog";

type Item = { id: string; url: string; name: string; alt: string; created_at: string; used_by: string[] };

function MediaCard({ item, reload, setError }: { item: Item; reload: () => Promise<void>; setError: (m: string) => void }) {
  const [alt, setAlt] = useState(item.alt);
  const [saved, setSaved] = useState(true);
  const inUse = item.used_by.length > 0;
  const confirm = useConfirm();

  async function saveAlt() {
    if (saved) return;
    const res = await fetch("/api/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, alt }),
    });
    if (res.ok) setSaved(true);
    else setError((await res.json().catch(() => ({}))).error || "Could not save alt text");
  }

  async function remove() {
    if (!(await confirm({ title: `Delete "${item.name}" permanently?`, confirmLabel: "Delete" }))) return;
    const res = await fetch(`/api/media?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
    if (!res.ok) setError((await res.json().catch(() => ({}))).error || "Could not delete");
    await reload();
  }

  return (
    <li className="rounded-md border border-gray-200 bg-white p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt={alt} className="aspect-square w-full rounded bg-gray-50 object-contain" />
      <p className="mt-2 truncate text-xs font-medium text-gray-900" title={item.name}>{item.name}</p>
      <label className="mt-2 block text-[11px] font-medium text-gray-600">
        Alt text {alt ? null : <span className="text-amber-700">(missing)</span>}
        <input
          value={alt}
          maxLength={200}
          onChange={(e) => { setAlt(e.target.value); setSaved(false); }}
          onBlur={saveAlt}
          placeholder="What the image shows"
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:border-gray-900 focus:outline-none"
        />
      </label>
      <p className="mt-2 text-[11px] text-gray-500" title={item.used_by.join("\n")}>
        {inUse ? `Used by ${item.used_by.length === 1 ? item.used_by[0] : `${item.used_by.length} places`}` : "Not used"}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <button type="button" onClick={() => navigator.clipboard.writeText(item.url)} className="text-[11px] font-semibold text-gray-700 hover:underline">
          Copy link
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={inUse}
          title={inUse ? "Remove it from where it is used first" : undefined}
          className="text-[11px] font-semibold text-rose-700 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export function MediaLibrary() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch("/api/media");
    const data = await res.json().catch(() => ({}));
    if (res.ok) setItems(data.media);
    else setError(data.error || "Could not load the library");
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  async function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (!e.dataTransfer.files.length) return;
    setError("");
    setUploading(true);
    try {
      await uploadImages(e.dataTransfer.files);
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center gap-3 rounded-md border-2 border-dashed p-8 text-center text-sm ${dragging ? "border-gray-900 bg-gray-50" : "border-gray-300 bg-white"}`}
      >
        <p className="text-gray-600">{uploading ? "Uploading…" : "Drop PNG, JPEG or WebP images here, up to 5 MB each, or"}</p>
        <UploadButton label="Choose files" onUploaded={() => reload()} />
      </div>

      {error ? <p role="alert" className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

      {!items ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">Nothing uploaded yet. Images uploaded for products and brands appear here too.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <MediaCard key={item.id} item={item} reload={reload} setError={setError} />
          ))}
        </ul>
      )}
    </div>
  );
}
