import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const ACTIONS = ["pack", "book", "ship", "deliver"];

/** Proxies a fulfilment transition with the signed-in admin's token. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const { id, action } = await params;
    if (!ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Unknown action" }, { status: 404 });
    }

    const token = (await cookies()).get("admin_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.text();
    const res = await fetch(`${BASE_URL}/admin/fulfilment/orders/${id}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body || "{}",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Streams the courier label PNG so the packer can print it. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const { id, action } = await params;
  if (action !== "label") return NextResponse.json({ error: "Unknown action" }, { status: 404 });

  const token = (await cookies()).get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${BASE_URL}/admin/fulfilment/orders/${id}/label`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  }
  return new NextResponse(res.body, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": res.headers.get("Content-Disposition") || "inline",
    },
  });
}
