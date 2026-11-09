import { NextRequest, NextResponse } from "next/server";
import { adminCall } from "@/lib/medusa-admin";

export async function GET() {
  const res = await adminCall("GET", "/admin/moderation/questions");
  return NextResponse.json(res.data, { status: res.status });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const res = await adminCall("POST", "/admin/moderation/questions", body);
  return NextResponse.json(res.data, { status: res.status });
}
