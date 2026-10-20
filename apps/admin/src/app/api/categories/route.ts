import { NextRequest, NextResponse } from "next/server";
import { adminCall, respond, slugify } from "@/lib/medusa-admin";

const FIELDS = "id,name,handle,is_active,parent_category_id,rank";

export async function GET() {
  return respond(await adminCall("GET", `/admin/product-categories?limit=1000&fields=${FIELDS}`));
}

/** Creates a category. Handles are prefixed with the parent's handle so "T-Motor" can exist under both Motors and ESCs. */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { name?: string; parent_category_id?: string };
  const name = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  let handle = slugify(name);
  if (body.parent_category_id) {
    const parent = await adminCall("GET", `/admin/product-categories/${body.parent_category_id}?fields=handle`);
    if (!parent.ok) return respond(parent);
    handle = `${parent.data.product_category.handle}-${handle}`.slice(0, 120);
  }

  return respond(
    await adminCall("POST", "/admin/product-categories", {
      name,
      handle,
      is_active: true,
      parent_category_id: body.parent_category_id || null,
    })
  );
}
