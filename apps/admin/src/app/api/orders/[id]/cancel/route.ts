import { NextResponse } from "next/server";
import { adminCall } from "@/lib/medusa-admin";

/** Medusa's own order-cancel workflow — refuses if any fulfillment isn't already canceled. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await adminCall("POST", `/admin/orders/${id}/cancel`);
  return NextResponse.json(res.data, { status: res.status });
}
