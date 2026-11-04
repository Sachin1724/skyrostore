import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/data/products";

/** Products from the categories a visitor has been looking at, minus what they already viewed. */
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("c") || "").split(",").filter(Boolean).slice(0, 5);
  const seen = new Set((request.nextUrl.searchParams.get("x") || "").split(",").filter(Boolean));
  if (ids.length === 0) return NextResponse.json({ products: [] });
  try {
    const { products } = await getProducts({ limit: 30, category_id: ids });
    return NextResponse.json({ products: products.filter((p) => !seen.has(p.id)).slice(0, 12) });
  } catch {
    return NextResponse.json({ products: [] });
  }
}
