import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ensureReviewsTables, type SavedCartItem } from "../../../lib/reviews-db";
import { getEffectiveCustomerId } from "../../../lib/customer-id";

// Cart's "Save for Later": persisted per customer (or per visitor, for guests)
// instead of localStorage, so it survives a cleared browser or a new device.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = getEffectiveCustomerId(req);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

  try {
    await ensureReviewsTables(db);
    const items: SavedCartItem[] = await db("saved_cart_item")
      .where({ customer_id: customerId })
      .orderBy("created_at", "desc");
    return res.status(200).json({ items });
  } catch (error) {
    console.error("Error fetching saved cart items:", error);
    return res.status(500).json({ error: "Failed to load saved items" });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = getEffectiveCustomerId(req);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  const body = req.body as Partial<SavedCartItem>;

  if (!body.product_id || !body.variant_id || !body.title || typeof body.unit_price !== "number" || !body.currency_code) {
    return res.status(400).json({ error: "product_id, variant_id, title, unit_price and currency_code are required" });
  }

  try {
    await ensureReviewsTables(db);
    await db("saved_cart_item")
      .where({ customer_id: customerId, variant_id: body.variant_id })
      .delete();
    const id = `sc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await db("saved_cart_item").insert({
      id,
      customer_id: customerId,
      product_id: body.product_id,
      variant_id: body.variant_id,
      title: body.title,
      handle: body.handle ?? null,
      thumbnail: body.thumbnail ?? null,
      unit_price: body.unit_price,
      currency_code: body.currency_code,
      created_at: new Date(),
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error saving cart item:", error);
    return res.status(500).json({ error: "Failed to save item" });
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const customerId = getEffectiveCustomerId(req);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  const body = req.body as { variant_id?: string };

  if (!body.variant_id) {
    return res.status(400).json({ error: "variant_id is required" });
  }

  try {
    await ensureReviewsTables(db);
    await db("saved_cart_item").where({ customer_id: customerId, variant_id: body.variant_id }).delete();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error removing saved cart item:", error);
    return res.status(500).json({ error: "Failed to remove item" });
  }
}
