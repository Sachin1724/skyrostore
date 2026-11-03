import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ensureReviewsTables, type WishlistItem } from "../../../lib/reviews-db";

function getEffectiveCustomerId(req: MedusaRequest): string {
  const actorId = (req as unknown as { auth_context?: { actor_id?: string } }).auth_context?.actor_id;
  if (actorId) return actorId;
  const headerId = req.headers["x-visitor-id"] as string | undefined;
  return headerId || "guest_default";
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = getEffectiveCustomerId(req);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

  try {
    await ensureReviewsTables(db);

    const items: WishlistItem[] = await db("customer_wishlist")
      .where({ customer_id: customerId })
      .orderBy("created_at", "desc");

    return res.status(200).json({
      customer_id: customerId,
      product_ids: items.map((i: WishlistItem) => i.product_id),
      items,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return res.status(500).json({ error: "Failed to retrieve wishlist" });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = getEffectiveCustomerId(req);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  const body = req.body as { product_id?: string };

  if (!body.product_id) {
    return res.status(400).json({ error: "Product id is required" });
  }

  try {
    await ensureReviewsTables(db);

    const exists = await db("customer_wishlist")
      .where({ customer_id: customerId, product_id: body.product_id })
      .first();

    if (!exists) {
      const id = `w_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db("customer_wishlist").insert({
        id,
        customer_id: customerId,
        product_id: body.product_id,
        created_at: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      product_id: body.product_id,
      saved: true,
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return res.status(500).json({ error: "Failed to update wishlist" });
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const customerId = getEffectiveCustomerId(req);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  const body = req.body as { product_id?: string };

  if (!body.product_id) {
    return res.status(400).json({ error: "Product id is required" });
  }

  try {
    await ensureReviewsTables(db);

    await db("customer_wishlist")
      .where({ customer_id: customerId, product_id: body.product_id })
      .delete();

    return res.status(200).json({
      success: true,
      product_id: body.product_id,
      saved: false,
    });
  } catch (error) {
    console.error("Error deleting from wishlist:", error);
    return res.status(500).json({ error: "Failed to update wishlist" });
  }
}
