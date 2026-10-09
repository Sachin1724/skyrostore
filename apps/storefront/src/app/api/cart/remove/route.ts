import { NextRequest, NextResponse } from "next/server";
import { medusa } from "@/lib/medusa";

export async function POST(request: NextRequest) {
  const { cart_id, line_item_id } = await request.json();
  if (!cart_id || !line_item_id) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { parent: cart } = await medusa.store.cart.deleteLineItem(
    cart_id,
    line_item_id
  );

  return NextResponse.json({ cart });
}
