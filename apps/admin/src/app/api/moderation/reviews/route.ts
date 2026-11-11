import { NextRequest, NextResponse } from "next/server";
import { adminCall } from "@/lib/medusa-admin";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") || "PENDING";
  const res = await adminCall("GET", `/admin/moderation/reviews?status=${encodeURIComponent(status)}`);
  return NextResponse.json(res.data, { status: res.status });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const res = await adminCall("POST", "/admin/moderation/reviews", body);
  return NextResponse.json(res.data, { status: res.status });
}
