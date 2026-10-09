import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

export async function POST(request: NextRequest) {
  const { email, password, first_name, last_name } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password required" },
      { status: 400 }
    );
  }

  try {
    // Register auth identity
    const authRes = await fetch(`${BASE}/auth/customer/emailpass/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PK,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!authRes.ok) {
      const err = await authRes.text();
      return NextResponse.json({ error: err }, { status: authRes.status });
    }

    const { token } = await authRes.json();

    // Create customer profile
    await fetch(`${BASE}/store/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PK,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ first_name, last_name }),
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set("customer_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
