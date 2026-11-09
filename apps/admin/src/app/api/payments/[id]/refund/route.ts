import { NextRequest, NextResponse } from "next/server";
import { adminCall } from "@/lib/medusa-admin";

/** Medusa's own refund-payment workflow — calls the registered provider's (Razorpay) refund API. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { amount?: number; note?: string };
  const res = await adminCall("POST", `/admin/payments/${id}/refund`, body);
  return NextResponse.json(res.data, { status: res.status });
}
