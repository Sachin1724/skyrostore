import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

// Always 200s, even for an email that doesn't exist — otherwise this becomes
// an account-enumeration endpoint.
export async function POST(request: NextRequest) {
  const { email } = await request.json().catch(() => ({ email: "" }));
  if (email) {
    await fetch(`${BASE}/auth/customer/emailpass/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
      body: JSON.stringify({ identifier: email }),
    }).catch(() => null);
  }
  return NextResponse.json({ ok: true });
}
