import { NextRequest, NextResponse } from "next/server";
import { adminCall, getStoreMetadata, respond, setStoreMetadata } from "@/lib/medusa-admin";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { status?: "draft" | "active" | "inactive"; public?: boolean };

  // Which codes shoppers see is a store setting (a list of promotion ids), not part of the promotion.
  if (typeof body.public === "boolean") {
    try {
      const { metadata } = await getStoreMetadata();
      const ids = new Set((metadata.public_offers as string[] | undefined) ?? []);
      if (body.public) ids.add(id);
      else ids.delete(id);
      await setStoreMetadata({ public_offers: [...ids] });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Could not save" }, { status: 502 });
    }
    await fetch(`${process.env.STOREFRONT_URL || "http://localhost:3000"}/api/revalidate`, {
      method: "POST",
      headers: { "x-revalidate-secret": process.env.REVALIDATE_SECRET || "" },
    }).catch(() => null);
    return NextResponse.json({ ok: true });
  }

  if (!body.status) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  return respond(await adminCall("POST", `/admin/promotions/${id}`, { status: body.status }));
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return respond(await adminCall("DELETE", `/admin/promotions/${id}`));
}
