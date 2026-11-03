import { NextRequest, NextResponse } from "next/server";
import { getProduct, getProductByHandle } from "@/lib/data/products";
import { getCompatibleProducts } from "@/lib/data/compatible-products";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const handle = searchParams.get("handle");

  if (!id && !handle) {
    return NextResponse.json({ error: "Product id or handle required" }, { status: 400 });
  }

  try {
    const product = id ? await getProduct(id) : await getProductByHandle(handle!);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const compatible = await getCompatibleProducts(product);
    return NextResponse.json({
      product_id: product.id,
      handle: product.handle,
      compatible,
    });
  } catch (err) {
    console.error("Error in /api/uav/compatible:", err);
    return NextResponse.json({ error: "Failed to evaluate compatible products" }, { status: 500 });
  }
}
