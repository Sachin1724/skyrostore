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
