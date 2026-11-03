import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getStoreMetadata, setStoreMetadata } from "@/lib/medusa-admin";
import type { MediaItem } from "../media/route";

const BASE_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
// Images for galleries, PDFs for datasheets and manuals.
const MAX_BYTES: Record<string, number> = {
  "image/png": 5 * 1024 * 1024,
  "image/jpeg": 5 * 1024 * 1024,
  "image/webp": 5 * 1024 * 1024,
  "application/pdf": 20 * 1024 * 1024,
};

/** Forwards product images to Medusa's file module and returns their public URLs. */
export async function POST(request: NextRequest) {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const incoming = await request.formData().catch(() => null);
  const files = (incoming?.getAll("files") ?? []).filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files received" }, { status: 400 });
  }
  for (const file of files) {
    const max = MAX_BYTES[file.type];
    if (!max) {
      return NextResponse.json({ error: `${file.name}: only PNG, JPEG, WebP images or PDF documents are allowed` }, { status: 400 });
    }
    if (file.size > max) {
      return NextResponse.json({ error: `${file.name}: larger than ${max / 1024 / 1024} MB` }, { status: 400 });
    }
  }

  const form = new FormData();
  for (const file of files) form.append("files", file, file.name);

  const res = await fetch(`${BASE_URL}/admin/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: data?.message || `Upload failed (${res.status})` },
      { status: res.status }
    );
  }

  const uploaded = (data.files ?? []) as { id: string; url: string }[];

  // Every upload joins the media library so it can be reused and later deleted.
  // The file is already stored, so a failed index write is reported, not fatal.
  let indexed = true;
  try {
    const { metadata } = await getStoreMetadata();
    const now = new Date().toISOString();
    const added: MediaItem[] = uploaded.map((f, i) => ({ id: f.id, url: f.url, name: files[i]?.name ?? f.id, alt: "", created_at: now }));
    await setStoreMetadata({ media: [...added, ...((metadata.media as MediaItem[]) ?? [])] });
  } catch {
    indexed = false;
  }
  return NextResponse.json({
    ok: true,
    urls: uploaded.map((f) => f.url),
    files: uploaded.map((f, i) => ({ url: f.url, name: files[i]?.name ?? f.id, size: files[i]?.size ?? 0 })),
    indexed,
  });
}
