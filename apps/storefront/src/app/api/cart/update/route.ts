import { NextRequest, NextResponse } from "next/server";
import { medusa } from "@/lib/medusa";

export async function POST(request: NextRequest) {
  const { cart_id, line_item_id, quantity } = await request.json();
  if (!cart_id || !line_item_id || typeof quantity !== "number" || quantity < 1) {
    return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
  }

  try {
    const { cart } = await medusa.store.cart.updateLineItem(
      cart_id,
      line_item_id,
      { quantity }
    );
    return NextResponse.json({ cart });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}
