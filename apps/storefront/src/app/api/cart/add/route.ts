import { NextRequest, NextResponse } from "next/server";
import { medusa, CART_QUERY } from "@/lib/medusa";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cart_id, variant_id, quantity = 1, items } = body;

    let cartId = cart_id;

    if (!cartId) {
      // The configured region saves a round trip on every first add.
      const regionId = process.env.NEXT_PUBLIC_REGION_ID || (await medusa.store.region.list()).regions[0]?.id;
      if (!regionId) {
        return NextResponse.json(
          { error: "No region configured" },
          { status: 500 }
        );
      }
      const { cart } = await medusa.store.cart.create({
        region_id: regionId,
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
    let cart = null;
    for (const item of itemsToAdd) {
      if (!item.variant_id) continue;
      try {
        ({ cart } = await medusa.store.cart.createLineItem(
          cartId,
          { variant_id: item.variant_id, quantity: item.quantity || 1 },
          CART_QUERY
        ));
        successCount++;
      } catch (err) {
        console.error(`Failed to add line item ${item.variant_id} to cart:`, err);
      }
    }

    // The updated cart goes back with the id, so the header can show it without fetching again.
    return NextResponse.json({
      cart_id: cartId,
      added_count: successCount,
      cart,
    });
  } catch (error) {
    console.error("Cart add error:", error);
    return NextResponse.json(
      { error: "Failed to process cart addition" },
      { status: 500 }
    );
  }
}
