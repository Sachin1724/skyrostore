import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

export async function GET(request: NextRequest) {
  const visitorId = request.headers.get("x-visitor-id") || "";
  try {
    const res = await fetch(`${BASE}/store/wishlist`, {
      headers: {
        "x-publishable-api-key": PK,
        "x-visitor-id": visitorId,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ product_ids: [] });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ product_ids: [] });
  }
}

export async function POST(request: NextRequest) {
  const visitorId = request.headers.get("x-visitor-id") || "";
  try {
    const body = await request.json();
    const res = await fetch(`${BASE}/store/wishlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PK,
        "x-visitor-id": visitorId,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const visitorId = request.headers.get("x-visitor-id") || "";
  try {
    const body = await request.json();
    const res = await fetch(`${BASE}/store/wishlist`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PK,
        "x-visitor-id": visitorId,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 });
  }
}
