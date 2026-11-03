import { NextRequest, NextResponse } from "next/server";
import { adminCall, getStoreMetadata, setStoreMetadata } from "@/lib/medusa-admin";

// The media library: an index, in the store's metadata, of files uploaded through
// /api/uploads. The files themselves live in Medusa's file module.

export type MediaItem = { id: string; url: string; name: string; alt: string; created_at: string };

const fail = (err: unknown, status = 502) =>
  NextResponse.json({ error: err instanceof Error ? err.message : "Request failed" }, { status });

/** Where each URL is used: product images and thumbnails, brand logos. */
async function usage(): Promise<Map<string, string[]>> {
  // ponytail: scans every product on each call; fine for a few thousand, index usage if it gets slow.
  const [products, brands] = await Promise.all([
    adminCall("GET", "/admin/products?limit=5000&fields=title,thumbnail,images.url"),
    adminCall("GET", "/admin/collections?limit=500&fields=title,metadata"),
  ]);
  if (!products.ok || !brands.ok) throw new Error("Could not check where images are used");

  const used = new Map<string, string[]>();
  const mark = (url: string | null | undefined, where: string) => {
    if (url) used.set(url, [...(used.get(url) ?? []), where]);
  };
  for (const p of products.data.products ?? []) {
    const urls = new Set<string>([p.thumbnail, ...(p.images ?? []).map((i: { url: string }) => i.url)].filter(Boolean));
    urls.forEach((url) => mark(url, `Product: ${p.title}`));
  }
  for (const b of brands.data.collections ?? []) mark(b.metadata?.logo, `Brand logo: ${b.title}`);
  return used;
}

export async function GET() {
  try {
    const [{ metadata }, used] = await Promise.all([getStoreMetadata(), usage()]);
    const media = ((metadata.media as MediaItem[]) ?? []).map((m) => ({ ...m, used_by: used.get(m.url) ?? [] }));
    return NextResponse.json({ media });
  } catch (err) {
    return fail(err);
  }
}

/** `{ id, alt }` updates an item's alt text. */
export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { id?: string; alt?: string };
  const alt = typeof body.alt === "string" ? body.alt.trim().slice(0, 200) : "";
  try {
    const { metadata } = await getStoreMetadata();
    const media = (metadata.media as MediaItem[]) ?? [];
    if (!media.some((m) => m.id === body.id)) return fail(new Error("Not found"), 404);
    await setStoreMetadata({ media: media.map((m) => (m.id === body.id ? { ...m, alt } : m)) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}

/** `?id=` deletes the file, but only when nothing on the site uses it. */
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  try {
    const [{ metadata }, used] = await Promise.all([getStoreMetadata(), usage()]);
    const media = (metadata.media as MediaItem[]) ?? [];
    const item = media.find((m) => m.id === id);
    if (!item) return fail(new Error("Not found"), 404);
    const where = used.get(item.url);
    if (where?.length) return fail(new Error(`Still used by ${where.join(", ")}`), 409);

    const res = await adminCall("DELETE", `/admin/uploads/${encodeURIComponent(item.id)}`);
    // Already gone from storage is fine; anything else keeps the entry so nothing is orphaned.
    if (!res.ok && res.status !== 404) return fail(new Error(res.data?.message || "Could not delete the file"), res.status);
    await setStoreMetadata({ media: media.filter((m) => m.id !== item.id) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
