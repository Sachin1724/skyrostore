import { NextRequest, NextResponse } from "next/server";
import { adminCall } from "@/lib/medusa-admin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { location_id?: string; stocked_quantity?: number };
  if (!body.location_id || typeof body.stocked_quantity !== "number" || body.stocked_quantity < 0) {
    return NextResponse.json({ error: "location_id and a non-negative stocked_quantity are required" }, { status: 400 });
  }
  const res = await adminCall("POST", `/admin/inventory-items/${id}/location-levels/${body.location_id}`, {
    stocked_quantity: body.stocked_quantity,
  });
  return NextResponse.json(res.data, { status: res.status });
}
