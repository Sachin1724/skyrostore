import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

/** Called by the admin after publishing homepage copy, so the change shows in seconds. */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  revalidateTag("site-content");
  return NextResponse.json({ ok: true });
}
