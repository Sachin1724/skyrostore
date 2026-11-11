import { NextRequest, NextResponse } from "next/server";
import { adminCall } from "@/lib/medusa-admin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const res = await adminCall("POST", `/admin/returns/${id}`, body);
  return NextResponse.json(res.data, { status: res.status });
}
