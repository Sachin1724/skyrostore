import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

const auth = async () => (await cookies()).get("customer_token")?.value;
const headers = (token: string) => ({
  "Content-Type": "application/json",
  "x-publishable-api-key": PK,
  Authorization: `Bearer ${token}`,
});

/**
 * The signed-in customer's own record, or { customer: null } when signed out. The header asks on every
 * page, so signed out is a normal answer (200), not an error the browser logs. Addresses and cards are
 * not here: Razorpay holds those.
 */
export async function GET() {
  const token = await auth();
  if (!token) return NextResponse.json({ customer: null });
  try {
    const res = await fetch(`${BASE}/store/customers/me`, { headers: headers(token), cache: "no-store" });
    // An expired token: drop the cookie so every page and the header agree the visitor is signed out.
    if (res.status === 401) {
      const out = NextResponse.json({ customer: null });
      out.cookies.delete("customer_token");
      return out;
    }
    if (!res.ok) return NextResponse.json({ error: "Could not load your details" }, { status: res.status });
    const { customer } = await res.json();
    return NextResponse.json({
      customer: {
        email: customer?.email ?? "",
        first_name: customer?.first_name ?? "",
        last_name: customer?.last_name ?? "",
        phone: customer?.phone ?? "",
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not load your details" }, { status: 502 });
  }
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: NextRequest) {
  const token = await auth();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  // Email is the login identity, so it is not editable here.
  const patch = {
    first_name: text(body.first_name, 80),
    last_name: text(body.last_name, 80),
    phone: text(body.phone, 20),
  };
  try {
    const res = await fetch(`${BASE}/store/customers/me`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify(patch),
    });
    if (!res.ok) return NextResponse.json({ error: "Could not save your details" }, { status: res.status });
    return NextResponse.json({ ok: true, customer: patch });
  } catch {
    return NextResponse.json({ error: "Could not save your details" }, { status: 502 });
  }
}
