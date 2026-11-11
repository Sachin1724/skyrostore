/** Product page copy kept in product metadata under `listing` (edited in the admin's "Product page" tab). */
export type ListingDocument = { name: string; url: string; size: number };
export type Listing = {
  key_features: string[];
  in_the_box: string[];
  documents: ListingDocument[];
  warranty: string;
  hsn_code: string;
  gst_rate: number | null;
  dispatch_days: number | null;
  video_url: string;
};

const list = (v: unknown) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);

/** Tolerant read: anything missing or malformed comes back empty, so the section hides. */
export function readListing(metadata: Record<string, unknown> | null | undefined): Listing {
  const raw = (metadata?.listing ?? {}) as Record<string, unknown>;
  return {
    key_features: list(raw.key_features),
    in_the_box: list(raw.in_the_box),
    documents: Array.isArray(raw.documents)
      ? (raw.documents as ListingDocument[]).filter((d) => d && /^https?:\/\//.test(String(d.url)))
      : [],
    warranty: typeof raw.warranty === "string" ? raw.warranty : "",
    hsn_code: typeof raw.hsn_code === "string" ? raw.hsn_code : "",
    gst_rate: typeof raw.gst_rate === "number" ? raw.gst_rate : null,
    dispatch_days: typeof raw.dispatch_days === "number" ? raw.dispatch_days : null,
    video_url: typeof raw.video_url === "string" && raw.video_url.startsWith("https://") ? raw.video_url : "",
  };
}

export const fileSize = (b: number) =>
  b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : b > 0 ? `${Math.max(1, Math.round(b / 1024))} KB` : "";
