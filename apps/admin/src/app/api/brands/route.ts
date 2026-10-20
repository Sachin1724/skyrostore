import { NextRequest, NextResponse } from "next/server";
import { adminCall, respond, slugify } from "@/lib/medusa-admin";

// Brands are Medusa collections; the logo URL lives in metadata.logo.
export async function GET() {
  return respond(await adminCall("GET", "/admin/collections?limit=500&fields=id,title,handle,metadata"));
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { title?: string; logo?: string };
  const title = (body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
  return respond(
    await adminCall("POST", "/admin/collections", {
      title,
      handle: slugify(title),
      metadata: body.logo ? { logo: body.logo } : {},
    })
  );
}
