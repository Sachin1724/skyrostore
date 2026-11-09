import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ensureReviewsTables, type ProductReview } from "../../../../lib/reviews-db";
import { lookupProducts } from "../../../../lib/product-lookup";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  const status = req.query.status as string | undefined;
  const productId = req.query.product_id as string | undefined;

  try {
    await ensureReviewsTables(db);

    let q = db("product_review").select("*").orderBy("created_at", "desc");
    if (status) q = q.where({ status });
    if (productId) q = q.where({ product_id: productId });

    const reviews: ProductReview[] = await q;
    const products = await lookupProducts(req, [...new Set(reviews.map((r) => r.product_id))]);
    const enriched = reviews.map((r) => ({ ...r, product: products.get(r.product_id) ?? null }));
    return res.status(200).json({ count: reviews.length, reviews: enriched });
  } catch (error) {
    console.error("Error fetching admin reviews:", error);
    return res.status(500).json({ error: "Failed to load reviews" });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  const body = req.body as {
    review_id?: string;
    status?: "APPROVED" | "REJECTED" | "PENDING";
  };

  if (!body.review_id || !body.status) {
    return res.status(400).json({ error: "review_id and status are required" });
  }

  try {
    await ensureReviewsTables(db);

    const updated = await db("product_review")
      .where({ id: body.review_id })
      .update({ status: body.status })
      .returning("*");

    return res.status(200).json({ success: true, review: updated[0] });
  } catch (error) {
    console.error("Error updating review status:", error);
    return res.status(500).json({ error: "Failed to update review" });
  }
}
