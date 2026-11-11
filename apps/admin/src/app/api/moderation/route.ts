import { NextResponse } from "next/server";
import { adminCall } from "@/lib/medusa-admin";

export async function GET() {
  const res = await adminCall("GET", "/admin/moderation");
  return NextResponse.json(res.data, { status: res.status });
}
