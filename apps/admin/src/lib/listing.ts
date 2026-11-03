/**
 * Product page copy that is not a technical spec, stored in product metadata under `listing`.
 * The storefront shows each part only when it is filled in.
 */
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

export const EMPTY_LISTING: Listing = {
  key_features: [],
  in_the_box: [],
  documents: [],
  warranty: "",
  hsn_code: "",
  gst_rate: null,
  dispatch_days: null,
  video_url: "",
};

const GST_RATES = [0, 5, 12, 18, 28];
const lines = (v: unknown) =>
  Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, 30) : null;

export function readListing(metadata: Record<string, unknown> | null | undefined): Listing {
  const raw = (metadata?.listing ?? {}) as Partial<Listing>;
  return { ...EMPTY_LISTING, ...raw };
}

/** Validates what the editor sends; returns a clean listing or the first problem found. */
export function parseListing(input: unknown): { listing: Listing } | { error: string } {
  const v = (input ?? {}) as Record<string, unknown>;
  const key_features = lines(v.key_features);
  const in_the_box = lines(v.in_the_box);
  if (!key_features || !in_the_box) return { error: "Features and box contents must be lists" };

  const documents: ListingDocument[] = [];
  for (const d of Array.isArray(v.documents) ? v.documents : []) {
    const doc = d as Record<string, unknown>;
    const url = String(doc.url ?? "");
    if (!/^https?:\/\//.test(url)) return { error: "Each document needs an uploaded file" };
    documents.push({ name: String(doc.name ?? "").trim() || "Document", url, size: Math.max(0, Number(doc.size) || 0) });
  }

  const gst = v.gst_rate === null || v.gst_rate === "" || v.gst_rate === undefined ? null : Number(v.gst_rate);
  if (gst !== null && !GST_RATES.includes(gst)) return { error: "GST rate must be 0, 5, 12, 18 or 28" };
  const days = v.dispatch_days === null || v.dispatch_days === "" || v.dispatch_days === undefined ? null : Number(v.dispatch_days);
  if (days !== null && (!Number.isInteger(days) || days < 0 || days > 60)) return { error: "Dispatch days must be a whole number from 0 to 60" };
  const hsn = String(v.hsn_code ?? "").trim();
  if (hsn && !/^\d{4,8}$/.test(hsn)) return { error: "HSN code is 4 to 8 digits" };
  const video = String(v.video_url ?? "").trim();
  if (video && !/^https:\/\//.test(video)) return { error: "Video link must start with https://" };

  return {
    listing: {
      key_features,
      in_the_box,
      documents,
      warranty: String(v.warranty ?? "").trim().slice(0, 200),
      hsn_code: hsn,
      gst_rate: gst,
      dispatch_days: days,
      video_url: video,
    },
  };
}
