import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ensureReviewsTables, type WishlistItem } from "../../../lib/reviews-db";
import { getEffectiveCustomerId } from "../../../lib/customer-id";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = getEffectiveCustomerId(req);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

  try {
    await ensureReviewsTables(db);

    const rows: WishlistItem[] = await db("customer_wishlist")
      .where({ customer_id: customerId })
      .orderBy("created_at", "desc");

    const productIds = rows.map((r) => r.product_id);
    let byId = new Map<string, { title: string; handle: string; thumbnail: string | null; inStock: boolean; variantId?: string }>();
    if (productIds.length) {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
      const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "title", "handle", "thumbnail", "variants.id", "variants.manage_inventory", "variants.inventory_quantity"],
        filters: { id: productIds },
      });
      byId = new Map(
        (products as any[]).map((p) => [
          p.id,
          {
            title: (p.title as string)?.replace("[DEV] ", ""),
            handle: p.handle,
            thumbnail: p.thumbnail,
            variantId: p.variants?.[0]?.id,
            inStock: (p.variants ?? []).some((v: any) => !v.manage_inventory || (v.inventory_quantity ?? 0) > 0),
          },
        ])
      );
    }

    // ponytail: price needs a region/currency context this route doesn't have;
    // the storefront already shows live price on the product page it links to.
    const items = rows
      .map((r) => {
        const p = byId.get(r.product_id);
        if (!p) return null;
        return { productId: r.product_id, variantId: p.variantId, title: p.title, handle: p.handle, thumbnail: p.thumbnail, price: null, currency: "inr", inStock: p.inStock };
      })
      .filter((i): i is NonNullable<typeof i> => i !== null);

    return res.status(200).json({
      customer_id: customerId,
      product_ids: rows.map((i) => i.product_id),
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
