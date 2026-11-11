import { NextRequest, NextResponse } from "next/server";
import { getStoreMetadata, setStoreMetadata } from "@/lib/medusa-admin";

// Homepage copy lives in the store's metadata: `site_content_draft` while editing,
// `site_content` once published. The storefront reads only the published key.

export type HeroSlide = { image: string; title: string; text: string; cta: string; href: string };

export type SiteContent = {
  heroSlides: HeroSlide[];
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
  const slides = Array.isArray(v.heroSlides) ? v.heroSlides : [];
  return {
    heroSlides: slides
      .slice(0, 6)
      .map((s) => ({ image: text(s?.image, 500), title: text(s?.title, 80), text: text(s?.text, 160), cta: text(s?.cta, 30), href: text(s?.href, 200) }))
      .filter((s) => s.image),
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

const fail = (err: unknown) => NextResponse.json({ error: err instanceof Error ? err.message : "Request failed" }, { status: 502 });

export async function GET() {
  try {
    const { metadata } = await getStoreMetadata();
    return NextResponse.json({ draft: metadata.site_content_draft ?? null, published: metadata.site_content ?? null });
  } catch (err) {
    return fail(err);
  }
}

/** Body `{ content }` saves a draft; `{ content, publish: true }` saves and publishes it. */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { content?: unknown; publish?: boolean };
  const content = clean(body.content);

  try {
    await setStoreMetadata({ site_content_draft: content, ...(body.publish ? { site_content: content } : {}) });
  } catch (err) {
    return fail(err);
  }
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
