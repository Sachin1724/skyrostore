import { NextRequest, NextResponse } from "next/server";
import { adminCall, respond } from "@/lib/medusa-admin";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { name?: string; is_active?: boolean };
  const update: Record<string, unknown> = {};
  if (body.name !== undefined) {
    if (!body.name.trim()) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    update.name = body.name.trim();
  }
  if (body.is_active !== undefined) update.is_active = !!body.is_active;
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  return respond(await adminCall("POST", `/admin/product-categories/${id}`, update));
}

/** Refuses to delete a category that still has sub-categories or products, so nothing is orphaned silently. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [children, products] = await Promise.all([
    adminCall("GET", `/admin/product-categories?parent_category_id=${id}&limit=1&fields=id`),
    adminCall("GET", `/admin/products?category_id=${id}&limit=1&fields=id`),
  ]);
  if ((children.data.count ?? 0) > 0) {
    return NextResponse.json({ error: "Remove or move its sub-categories first." }, { status: 409 });
  }
  if ((products.data.count ?? 0) > 0) {
    return NextResponse.json(
      { error: `${products.data.count} product(s) are in this category. Move them first, or hide the category instead.` },
      { status: 409 }
    );
  }
  return respond(await adminCall("DELETE", `/admin/product-categories/${id}`));
}
