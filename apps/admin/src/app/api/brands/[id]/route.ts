import { NextRequest, NextResponse } from "next/server";
import { adminCall, respond } from "@/lib/medusa-admin";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { title?: string; logo?: string | null };
  const update: Record<string, unknown> = {};
  if (body.title !== undefined) {
    if (!body.title.trim()) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    update.title = body.title.trim();
  }
  if (body.logo !== undefined) {
    const current = await adminCall("GET", `/admin/collections/${id}?fields=metadata`);
    if (!current.ok) return respond(current);
    update.metadata = { ...(current.data.collection?.metadata ?? {}), logo: body.logo || null };
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  return respond(await adminCall("POST", `/admin/collections/${id}`, update));
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const products = await adminCall("GET", `/admin/products?collection_id=${id}&limit=1&fields=id`);
  if ((products.data.count ?? 0) > 0) {
    return NextResponse.json(
      { error: `${products.data.count} product(s) use this brand. Reassign them first.` },
      { status: 409 }
    );
  }
  return respond(await adminCall("DELETE", `/admin/collections/${id}`));
}
