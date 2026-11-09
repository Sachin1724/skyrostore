import { NextRequest, NextResponse } from "next/server";
import { adminCall } from "@/lib/medusa-admin";

// Current retail price for one variant, so a quote line can start from the
// real list price instead of the operator remembering or re-looking it up.
export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("product_id");
  const variantId = request.nextUrl.searchParams.get("variant_id");
  if (!productId) {
    return NextResponse.json({ error: "product_id is required" }, { status: 400 });
  }

  const res = await adminCall("GET", `/admin/products/${productId}?fields=variants.id,variants.prices.amount,variants.prices.currency_code`);
  if (!res.ok) return NextResponse.json(res.data, { status: res.status });

  const variants = res.data?.product?.variants ?? [];
  const variant = variantId ? variants.find((v: { id: string }) => v.id === variantId) : variants[0];
  const price = variant?.prices?.find((p: { currency_code: string }) => p.currency_code === "inr") ?? variant?.prices?.[0];

  return NextResponse.json({ unit_price: price?.amount ?? null });
}
