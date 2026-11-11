import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fields = [
      "*",
      "items.*",
      "items.product.metadata",
      "shipping_address.*",
      "fulfillments.id",
      "fulfillments.shipped_at",
      "fulfillments.delivered_at",
      "fulfillments.canceled_at",
      "fulfillments.metadata",
      "fulfillments.labels.tracking_number",
      "fulfillments.labels.tracking_url",
    ].join(",");

    const res = await fetch(`${BASE}/store/orders/${encodeURIComponent(id)}?fields=${encodeURIComponent(fields)}`, {
      headers: {
        "x-publishable-api-key": PK,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (res.status === 404) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      throw new Error(`${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
