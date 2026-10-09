import { NextRequest, NextResponse } from "next/server";
import { medusa } from "@/lib/medusa";

export async function POST(request: NextRequest) {
  const { cart_id, variant_id, quantity = 1 } = await request.json();

  let cartId = cart_id;

  if (!cartId) {
    const regions = await medusa.store.region.list();
    const region = regions.regions[0];
    if (!region) {
      return NextResponse.json(
        { error: "No region configured" },
        { status: 500 }
      );
    }
    const { cart } = await medusa.store.cart.create({
      region_id: region.id,
      sales_channel_id: process.env.NEXT_PUBLIC_SALES_CHANNEL_ID || undefined,
    });
    cartId = cart.id;
  }

  await medusa.store.cart.createLineItem(cartId, {
    variant_id,
    quantity,
  });

  return NextResponse.json({ cart_id: cartId });
}
