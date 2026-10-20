"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import type { Brand } from "@/lib/catalog";
import { UploadButton } from "../products/image-uploader";

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function BrandRow({ brand, reload, setError }: { brand: Brand; reload: () => Promise<void>; setError: (m: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(brand.title);

  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    try { await fn(); await reload(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Request failed"); }
  };

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      {brand.metadata?.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.metadata.logo} alt="" className="h-9 w-9 rounded border border-gray-200 object-contain" />
      ) : (
        <div className="h-9 w-9 rounded border border-dashed border-gray-300" />
      )}
      {editing ? (
        <>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-sm" autoFocus />
          <button type="button" aria-label="Save" onClick={() => run(async () => { await call(`/api/brands/${brand.id}`, "PATCH", { title }); setEditing(false); })} className="text-emerald-600"><Check className="h-4 w-4" /></button>
          <button type="button" aria-label="Cancel" onClick={() => { setTitle(brand.title); setEditing(false); }} className="text-gray-400"><X className="h-4 w-4" /></button>
        </>
      ) : (
        <>
          <span className="text-sm font-medium text-gray-900">{brand.title}</span>
          <button type="button" aria-label="Rename" onClick={() => setEditing(true)} className="text-gray-400 hover:text-gray-700"><Pencil className="h-3.5 w-3.5" /></button>
        </>
      )}
      <div className="ml-auto flex items-center gap-3">
        <UploadButton multiple={false} label={brand.metadata?.logo ? "Replace logo" : "Add logo"} onUploaded={(urls) => run(() => call(`/api/brands/${brand.id}`, "PATCH", { logo: urls[0] }))} />
        <button type="button" aria-label="Delete" onClick={() => { if (window.confirm(`Delete "${brand.title}"?`)) void run(() => call(`/api/brands/${brand.id}`, "DELETE")); }} className="text-gray-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
      </div>
    </li>
  );
}

export function BrandManager() {
  const [brands, setBrands] = useState<Brand[] | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [newLogo, setNewLogo] = useState("");

  const reload = useCallback(async () => {
    try {
      const data = await call("/api/brands", "GET");
      setBrands((data.collections as Brand[]).sort((a, b) => a.title.localeCompare(b.title)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load brands");
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  return (
    <div className="mt-6 space-y-4">
      {error ? <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      <form
        className="flex items-center gap-2 rounded-md border border-gray-200 bg-white p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setError("");
          try { await call("/api/brands", "POST", { title: name, logo: newLogo || undefined }); setName(""); setNewLogo(""); await reload(); }
          catch (err: unknown) { setError(err instanceof Error ? err.message : "Request failed"); }
        }}
      >
        {newLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={newLogo} alt="" className="h-9 w-9 rounded border border-gray-200 object-contain" />
        ) : null}
        <UploadButton multiple={false} label={newLogo ? "Replace logo" : "Upload logo"} onUploaded={(urls) => setNewLogo(urls[0] || "")} />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New brand, e.g. T-Motor" className="w-64 rounded border border-gray-300 px-2 py-1 text-sm" />
        <button type="submit" disabled={!name.trim()} className="rounded bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-40">Add brand</button>
      </form>
      <div className="rounded-md border border-gray-200 bg-white">
        {brands === null ? (
          <p className="p-4 text-sm text-gray-500">Loading…</p>
        ) : brands.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No brands yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">{brands.map((b) => <BrandRow key={b.id} brand={b} reload={reload} setError={setError} />)}</ul>
        )}
      </div>
    </div>
  );
}
