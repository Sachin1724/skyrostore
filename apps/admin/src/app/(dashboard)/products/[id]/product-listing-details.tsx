"use client";

import { useState } from "react";
import { UploadButton, uploadFiles } from "../image-uploader";
import { readListing, type Listing } from "@/lib/listing";

const INPUT = "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs focus:border-gray-900 focus:outline-none";
const LABEL = "block text-xs font-medium text-gray-700";
const HINT = "mt-1 text-xs text-gray-500";

const toLines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const fmtSize = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/**
 * Product page copy: key features, box contents, documents, warranty, tax and dispatch.
 * Saves on its own (inside the editor's form, so every button is type="button").
 * Anything left empty is simply not shown on the storefront.
 */
export function ProductListingDetails({ productId, metadata }: { productId: string; metadata: Record<string, unknown> }) {
  const initial = readListing(metadata);
  const [features, setFeatures] = useState(initial.key_features.join("\n"));
  const [box, setBox] = useState(initial.in_the_box.join("\n"));
  const [documents, setDocuments] = useState(initial.documents);
  const [warranty, setWarranty] = useState(initial.warranty);
  const [hsn, setHsn] = useState(initial.hsn_code);
  const [gst, setGst] = useState(initial.gst_rate == null ? "" : String(initial.gst_rate));
  const [dispatch, setDispatch] = useState(initial.dispatch_days == null ? "" : String(initial.dispatch_days));
  const [video, setVideo] = useState(initial.video_url);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    const listing: Partial<Record<keyof Listing, unknown>> = {
      key_features: toLines(features),
      in_the_box: toLines(box),
      documents,
      warranty,
      hsn_code: hsn,
      gst_rate: gst === "" ? null : Number(gst),
      dispatch_days: dispatch === "" ? null : Number(dispatch),
      video_url: video,
    };
    const res = await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setSaving(false);
    setMessage(res?.ok ? { ok: true, text: "Saved. The product page updates within a minute." } : { ok: false, text: data?.error || "Could not save. Check your connection." });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-gray-900">Overview</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label className={LABEL}>
            Key features
            <textarea value={features} onChange={(e) => setFeatures(e.target.value)} rows={6} className={INPUT} placeholder={"One per line, e.g.\nTriple-redundant IMU\nRuns ArduPilot and PX4"} />
            <span className={HINT}>One feature per line. Shown as a bullet list.</span>
          </label>
          <label className={LABEL}>
            In the box
            <textarea value={box} onChange={(e) => setBox(e.target.value)} rows={6} className={INPUT} placeholder={"One item per line, e.g.\n1 × flight controller\n6 × JST-GH cables"} />
            <span className={HINT}>Exactly what ships. Leave empty if unsure.</span>
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-gray-900">Documents</h3>
          <UploadButton
            label="Upload PDF"
            accept="application/pdf"
            uploadWith={async (files) => {
              const added = await uploadFiles(files);
              setDocuments((d) => [...d, ...added.map((f) => ({ ...f, name: f.name.replace(/\.pdf$/i, "") }))]);
            }}
          />
        </div>
        {documents.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No documents. Datasheets, manuals and pinouts you upload appear on the product page.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100">
            {documents.map((d, i) => (
              <li key={d.url} className="flex items-center gap-3 py-2">
                <input
                  aria-label="Document name"
                  value={d.name}
                  onChange={(e) => setDocuments((all) => all.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                />
                <span className="w-16 text-right text-xs text-gray-500">{fmtSize(d.size)}</span>
                <a href={d.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-gray-700 underline">Open</a>
                <button type="button" onClick={() => setDocuments((all) => all.filter((_, j) => j !== i))} className="text-xs font-semibold text-rose-600">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-gray-900">Warranty, tax and dispatch</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <label className={`${LABEL} md:col-span-3`}>
            Warranty
            <input value={warranty} onChange={(e) => setWarranty(e.target.value)} className={INPUT} placeholder="e.g. 6 months manufacturer warranty against defects" />
          </label>
          <label className={LABEL}>
            HSN code
            <input value={hsn} onChange={(e) => setHsn(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={8} className={INPUT} placeholder="e.g. 85015210" />
          </label>
          <label className={LABEL}>
            GST rate
            <select value={gst} onChange={(e) => setGst(e.target.value)} className={INPUT}>
              <option value="">Not set</option>
              {[0, 5, 12, 18, 28].map((r) => <option key={r} value={r}>{r}%</option>)}
            </select>
          </label>
          <label className={LABEL}>
            Dispatch within (days)
            <input value={dispatch} onChange={(e) => setDispatch(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={2} className={INPUT} placeholder="e.g. 1" />
            <span className={HINT}>Shown as "Ships in N days" only when set.</span>
          </label>
          <label className={`${LABEL} md:col-span-3`}>
            Video link
            <input value={video} onChange={(e) => setVideo(e.target.value)} type="url" className={INPUT} placeholder="https://www.youtube.com/watch?v=…" />
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {message ? <p role="status" className={`text-sm ${message.ok ? "text-emerald-700" : "text-rose-600"}`}>{message.text}</p> : null}
        <button type="button" onClick={save} disabled={saving} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">
          {saving ? "Saving…" : "Save product page details"}
        </button>
      </div>
    </div>
  );
}
