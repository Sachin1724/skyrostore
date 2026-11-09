import { NextRequest, NextResponse } from "next/server";
import { getStoreMetadata, setStoreMetadata } from "@/lib/medusa-admin";

// Business settings only. Razorpay keys and other secrets stay in the
// backend's own env vars — never editable or readable from a web form.
export type SiteSettings = { gstin: string; freeShippingThreshold: number };

const fail = (err: unknown) => NextResponse.json({ error: err instanceof Error ? err.message : "Request failed" }, { status: 502 });

function clean(input: unknown): SiteSettings {
  const v = (input ?? {}) as Record<string, unknown>;
  const threshold = Number(v.freeShippingThreshold);
  return {
    gstin: typeof v.gstin === "string" ? v.gstin.trim().slice(0, 15).toUpperCase() : "",
    freeShippingThreshold: Number.isFinite(threshold) && threshold >= 0 ? Math.round(threshold) : 0,
  };
}

export async function GET() {
  try {
    const { metadata } = await getStoreMetadata();
    const configured = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000"}/store/health`)
      .then((r) => r.json())
      .then((j) => j.configured)
      .catch(() => null);
    return NextResponse.json({
      settings: (metadata.site_settings as SiteSettings | undefined) ?? { gstin: "", freeShippingThreshold: 0 },
      configured,
    });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { settings?: unknown };
  const settings = clean(body.settings);

  try {
    await setStoreMetadata({ site_settings: settings });
  } catch (err) {
    return fail(err);
  }

  await fetch(`${process.env.STOREFRONT_URL || "http://localhost:3000"}/api/revalidate`, {
    method: "POST",
    headers: { "x-revalidate-secret": process.env.REVALIDATE_SECRET || "" },
  }).catch(() => null);

  return NextResponse.json({ ok: true, settings });
}
