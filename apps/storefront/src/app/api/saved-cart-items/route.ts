import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

export async function GET(request: NextRequest) {
  const visitorId = request.headers.get("x-visitor-id") || "";
  try {
    const res = await fetch(`${BASE}/store/saved-cart-items`, {
      headers: { "x-publishable-api-key": PK, "x-visitor-id": visitorId },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ items: [] });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ items: [] });
  }
}

export async function POST(request: NextRequest) {
  const visitorId = request.headers.get("x-visitor-id") || "";
  try {
    const body = await request.json();
    const res = await fetch(`${BASE}/store/saved-cart-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-publishable-api-key": PK, "x-visitor-id": visitorId },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Failed to save item" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const visitorId = request.headers.get("x-visitor-id") || "";
  try {
    const body = await request.json();
    const res = await fetch(`${BASE}/store/saved-cart-items`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-publishable-api-key": PK, "x-visitor-id": visitorId },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
  }
}
