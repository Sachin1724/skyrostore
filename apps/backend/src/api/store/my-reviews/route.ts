import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ensureReviewsTables, type ProductReview } from "../../../lib/reviews-db";
import { lookupProducts } from "../../../lib/product-lookup";

// The reviews a signed-in customer has written, across every product, with
// its own status so a pending one still shows (unlike the public per-product list).
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as unknown as { auth_context?: { actor_id?: string } }).auth_context?.actor_id;
  if (!customerId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

  try {
    await ensureReviewsTables(db);
    const reviews: ProductReview[] = await db("product_review")
      .where({ customer_id: customerId })
      .orderBy("created_at", "desc");

    const byId = await lookupProducts(req, [...new Set(reviews.map((r) => r.product_id))]);
    const enriched = reviews.map((r) => ({ ...r, product: byId.get(r.product_id) ?? null }));
    return res.status(200).json({ reviews: enriched });
  } catch (error) {
    console.error("Error fetching customer reviews:", error);
    return res.status(500).json({ error: "Failed to load reviews" });
  }
}
