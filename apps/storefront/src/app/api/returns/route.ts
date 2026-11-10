import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

export async function GET() {
  const token = (await cookies()).get("customer_token")?.value;
  if (!token) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const res = await fetch(`${BASE}/store/returns`, {
    headers: { "x-publishable-api-key": PK, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: NextRequest) {
  const token = (await cookies()).get("customer_token")?.value;
  if (!token) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const res = await fetch(`${BASE}/store/returns`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-publishable-api-key": PK, Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
