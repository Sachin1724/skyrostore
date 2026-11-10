import { NextRequest, NextResponse } from "next/server";
import { adminCall, respond } from "@/lib/medusa-admin";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { status?: "draft" | "active" | "inactive" };
  if (!body.status) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  return respond(await adminCall("POST", `/admin/promotions/${id}`, { status: body.status }));
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return respond(await adminCall("DELETE", `/admin/promotions/${id}`));
}
