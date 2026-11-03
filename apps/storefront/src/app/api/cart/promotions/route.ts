import { NextRequest, NextResponse } from "next/server";
import { medusa } from "@/lib/medusa";

export async function POST(request: NextRequest) {
  try {
    const { cart_id, promo_code } = await request.json();
    if (!cart_id || !promo_code) {
      return NextResponse.json({ error: "Missing cart_id or promo_code" }, { status: 400 });
    }

    const { cart } = await medusa.store.cart.update(cart_id, {
      promo_codes: [promo_code],
    });
    return NextResponse.json({ cart });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Promotion code could not be applied";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { cart_id } = await request.json();
    if (!cart_id) {
      return NextResponse.json({ error: "Missing cart_id" }, { status: 400 });
    }

    const { cart } = await medusa.store.cart.update(cart_id, {
      promo_codes: [],
    });
    return NextResponse.json({ cart });
  } catch {
    return NextResponse.json({ error: "Failed to remove promotion code" }, { status: 400 });
  }
}
