import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

async function authHeaders() {
  const token = (await cookies()).get("customer_token")?.value;
  return token ? { "x-publishable-api-key": PK, Authorization: `Bearer ${token}` } : null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headers = await authHeaders();
  if (!headers) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const res = await fetch(`${BASE}/store/customers/me/addresses/${id}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headers = await authHeaders();
  if (!headers) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const res = await fetch(`${BASE}/store/customers/me/addresses/${id}`, { method: "DELETE", headers });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
