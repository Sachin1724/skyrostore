import { visitorHeaders } from "@/lib/visitor-headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

/**
 * Same-origin collector so the browser can use `navigator.sendBeacon`, which
 * cannot set the publishable-key header itself. Always answers 202: event
 * collection must never surface an error to the customer.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    if (!body || body.length > 64_000) {
      return NextResponse.json({ accepted: 0 }, { status: 202 });
    }

    const res = await fetch(`${BASE}/store/analytics/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-publishable-api-key": PK, ...visitorHeaders(request) },
      body,
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: 202 });
  } catch {
    return NextResponse.json({ accepted: 0 }, { status: 202 });
  }
}
