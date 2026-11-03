import { NextRequest, NextResponse } from "next/server";
import { medusa } from "@/lib/medusa";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cart_id, variant_id, quantity = 1, items } = body;

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

    // Support batch add or single item
    const itemsToAdd: Array<{ variant_id: string; quantity: number }> = Array.isArray(items) && items.length > 0
      ? items
      : variant_id
      ? [{ variant_id, quantity }]
      : [];

    if (itemsToAdd.length === 0) {
      return NextResponse.json(
        { error: "No valid variant_id or items array provided" },
        { status: 400 }
      );
    }

    let successCount = 0;
    for (const item of itemsToAdd) {
      if (!item.variant_id) continue;
      try {
        await medusa.store.cart.createLineItem(cartId, {
          variant_id: item.variant_id,
          quantity: item.quantity || 1,
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to add line item ${item.variant_id} to cart:`, err);
      }
    }

    return NextResponse.json({
      cart_id: cartId,
      added_count: successCount,
    });
  } catch (error) {
    console.error("Cart add error:", error);
    return NextResponse.json(
      { error: "Failed to process cart addition" },
      { status: 500 }
    );
  }
}
