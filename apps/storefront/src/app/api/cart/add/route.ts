import { NextRequest, NextResponse } from "next/server";
import { medusa, CART_QUERY } from "@/lib/medusa";

type Item = { variant_id: string; quantity?: number };

async function newCart(): Promise<string | null> {
  // The configured region saves a round trip on every first add.
  const regionId = process.env.NEXT_PUBLIC_REGION_ID || (await medusa.store.region.list()).regions[0]?.id;
  if (!regionId) return null;
  const { cart } = await medusa.store.cart.create({
    region_id: regionId,
    sales_channel_id: process.env.NEXT_PUBLIC_SALES_CHANNEL_ID || undefined,
  });
  return cart.id;
}

async function addAll(cartId: string, items: Item[]) {
  let cart = null;
  const failed: string[] = [];
  for (const item of items) {
    try {
      ({ cart } = await medusa.store.cart.createLineItem(cartId, { variant_id: item.variant_id, quantity: item.quantity || 1 }, CART_QUERY));
    } catch (err) {
      console.error(`Failed to add line item ${item.variant_id} to cart:`, err);
      failed.push(item.variant_id);
    }
  }
  return { cart, failed };
}

/**
 * Adds one item or a batch. Returns the updated cart, how many lines went in and which variants did not,
 * so a bundle can say "2 of 3 added" instead of claiming all three.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cart_id, variant_id, quantity = 1, items } = body;

    const itemsToAdd: Item[] = (Array.isArray(items) && items.length > 0 ? items : variant_id ? [{ variant_id, quantity }] : []).filter(
      (i: Item) => i?.variant_id
    );
    if (itemsToAdd.length === 0) {
      return NextResponse.json({ error: "No valid variant_id or items array provided" }, { status: 400 });
    }

    let cartId: string | null = cart_id || (await newCart());
    if (!cartId) return NextResponse.json({ error: "No region configured" }, { status: 500 });
    let result = await addAll(cartId, itemsToAdd);

    // Nothing at all went into the browser's saved cart: it is usually completed (paid, with the
    // tab closed before the confirm step) or deleted. Start a fresh cart once instead of failing forever.
    if (cart_id && result.failed.length === itemsToAdd.length) {
      cartId = await newCart();
      if (cartId) result = await addAll(cartId, itemsToAdd);
    }

    // The updated cart goes back with the id, so the header can show it without fetching again.
    return NextResponse.json({
      cart_id: cartId,
      added_count: itemsToAdd.length - result.failed.length,
      failed_variant_ids: result.failed,
      cart: result.cart,
    });
  } catch (error) {
    console.error("Cart add error:", error);
    return NextResponse.json({ error: "Failed to process cart addition" }, { status: 500 });
  }
}
