import { NextRequest, NextResponse } from "next/server";
import { adminCall } from "@/lib/medusa-admin";

// Homepage copy lives in the store's metadata: `site_content_draft` while editing,
// `site_content` once published. The storefront reads only the published key.

export type SiteContent = {
  heroTitle: string;
  heroSentence: string;
  faq: { q: string; a: string }[];
  closingTitle: string;
  closingSentence: string;
};

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** Keeps only the known fields, as trimmed strings within sane lengths. */
function clean(input: unknown): SiteContent {
  const v = (input ?? {}) as Record<string, unknown>;
  const faq = Array.isArray(v.faq) ? v.faq : [];
  return {
    heroTitle: text(v.heroTitle, 80),
    heroSentence: text(v.heroSentence, 240),
    faq: faq
      .slice(0, 20)
      .map((item) => ({ q: text(item?.q, 160), a: text(item?.a, 800) }))
      .filter((item) => item.q && item.a),
    closingTitle: text(v.closingTitle, 80),
    closingSentence: text(v.closingSentence, 240),
  };
}

async function loadStore() {
  const res = await adminCall("GET", "/admin/stores?fields=id,metadata");
  const store = res.data?.stores?.[0] as { id: string; metadata: Record<string, unknown> | null } | undefined;
  return { res, store };
}

export async function GET() {
  const { res, store } = await loadStore();
  if (!store) return NextResponse.json({ error: res.data?.message || "Store not found" }, { status: res.status || 404 });
  const meta = store.metadata ?? {};
  return NextResponse.json({ draft: meta.site_content_draft ?? null, published: meta.site_content ?? null });
}

/** Body `{ content }` saves a draft; `{ content, publish: true }` saves and publishes it. */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { content?: unknown; publish?: boolean };
  const content = clean(body.content);

  const { res, store } = await loadStore();
  if (!store) return NextResponse.json({ error: res.data?.message || "Store not found" }, { status: res.status || 404 });

  // Send the whole metadata object so other keys survive whether Medusa merges or replaces.
  const metadata = { ...(store.metadata ?? {}), site_content_draft: content, ...(body.publish ? { site_content: content } : {}) };
  const saved = await adminCall("POST", `/admin/stores/${store.id}`, { metadata });
  if (!saved.ok) return NextResponse.json({ error: saved.data?.message || "Could not save" }, { status: saved.status });

  if (!body.publish) return NextResponse.json({ ok: true, content });

  // Tell the storefront to drop its cached copy; without this it refreshes within the hour anyway.
  const refreshed = await fetch(`${process.env.STOREFRONT_URL || "http://localhost:3000"}/api/revalidate`, {
    method: "POST",
    headers: { "x-revalidate-secret": process.env.REVALIDATE_SECRET || "" },
  })
    .then((r) => r.ok)
    .catch(() => false);
  return NextResponse.json({ ok: true, content, refreshed });
}
