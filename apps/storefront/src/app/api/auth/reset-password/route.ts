import { NextRequest, NextResponse } from "next/server";
import { passwordProblem } from "@/lib/password";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

export async function POST(request: NextRequest) {
  const { token, password } = await request.json().catch(() => ({}));
  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "That reset link is invalid or has expired." }, { status: 400 });
  }
  const problem = passwordProblem(password);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const res = await fetch(`${BASE}/auth/customer/emailpass/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PK,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json({ error: data.message || "That reset link is invalid or has expired." }, { status: res.status });
  }
  return NextResponse.json({ ok: true });
}
