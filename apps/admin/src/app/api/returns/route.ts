import { NextRequest, NextResponse } from "next/server";
import { adminCall } from "@/lib/medusa-admin";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const res = await adminCall("GET", `/admin/returns${status ? `?status=${encodeURIComponent(status)}` : ""}`);
  return NextResponse.json(res.data, { status: res.status });
}
