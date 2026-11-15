import { NextRequest, NextResponse } from "next/server";
import { getStoreMetadata, setStoreMetadata } from "@/lib/medusa-admin";

// Business settings only. Razorpay keys and other secrets stay in the
// backend's own env vars — never editable or readable from a web form.
export type SiteSettings = {
  legalName: string;
  address: string;
  gstin: string;
  phone: string;
  supportEmail: string;
  freeShippingThreshold: number;
};

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const fail = (err: unknown) => NextResponse.json({ error: err instanceof Error ? err.message : "Request failed" }, { status: 502 });

function clean(input: unknown): SiteSettings {
  const v = (input ?? {}) as Record<string, unknown>;
  const threshold = Number(v.freeShippingThreshold);
  return {
    legalName: text(v.legalName, 200),
    address: text(v.address, 500),
    gstin: text(v.gstin, 15).toUpperCase(),
    phone: text(v.phone, 30),
    supportEmail: text(v.supportEmail, 200),
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
      settings: clean(metadata.site_settings),
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
