"use client";

import { useRef, useState } from "react";

/** Uploads files to /api/uploads and hands back their URLs. */
export async function uploadImages(files: FileList | File[]): Promise<string[]> {
  const form = new FormData();
  for (const file of Array.from(files)) form.append("files", file);
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.urls as string[];
}

export function UploadButton({
  onUploaded,
  multiple = true,
  label = "Upload images",
}: {
  onUploaded: (urls: string[]) => void | Promise<void>;
  multiple?: boolean;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setBusy(true);
    setError("");
    try {
      await onUploaded(await uploadImages(files));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple={multiple}
        onChange={onChange}
        className="hidden"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {busy ? "Uploading…" : label}
      </button>
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

type LibraryItem = { id: string; url: string; name: string; alt: string };

/** Picks an already-uploaded image from the media library instead of uploading it again. */
export function LibraryButton({ onPicked }: { onPicked: (urls: string[]) => void | Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [error, setError] = useState("");

  async function open() {
    dialog.current?.showModal();
    setError("");
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load the library");
      setItems(data.media);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load the library");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
      >
        From library
      </button>
      <dialog ref={dialog} className="m-auto w-[min(90vw,720px)] rounded-lg p-0 backdrop:bg-black/40">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Media library</h2>
          <button type="button" onClick={() => dialog.current?.close()} className="text-xs font-semibold text-gray-600 hover:text-gray-900">
            Close
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
          {!items && !error ? <p className="text-xs text-gray-500">Loading…</p> : null}
          {items?.length === 0 ? <p className="text-xs text-gray-500">Nothing uploaded yet.</p> : null}
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {items?.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={async () => {
                    dialog.current?.close();
                    await onPicked([item.url]);
                  }}
                  className="block w-full rounded border border-gray-200 bg-gray-50 p-1 text-left hover:border-gray-900"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.alt} className="aspect-square w-full object-contain" />
                  <span className="mt-1 block truncate text-[11px] text-gray-600">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  );
}
