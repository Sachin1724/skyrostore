import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ensureReviewsTables, type ProductReview } from "../../../../../lib/reviews-db";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id: productId } = req.params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

  try {
    await ensureReviewsTables(db);

    const reviews: ProductReview[] = await db("product_review")
      .where({ product_id: productId, status: "APPROVED" })
      .orderBy("created_at", "desc");

    const total = reviews.length;
    const average = total > 0
      ? Number((reviews.reduce((acc: number, r: ProductReview) => acc + Number(r.rating), 0) / total).toFixed(1))
      : 0;

    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews) {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating))));
      breakdown[star] = (breakdown[star] || 0) + 1;
    }

    return res.status(200).json({
      product_id: productId,
      total_reviews: total,
      average_rating: average,
      breakdown,
      reviews,
    });
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return res.status(500).json({ error: "Failed to retrieve reviews" });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id: productId } = req.params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  const customerId = (req as unknown as { auth_context?: { actor_id?: string } }).auth_context?.actor_id || null;

  const body = req.body as {
    author_name?: string;
    rating?: number;
    title?: string;
    content?: string;
    hardware_setup?: string;
  };

  if (!body.author_name || !body.rating || !body.title || !body.content) {
    return res.status(400).json({ error: "Author name, rating (1-5), title, and content are required" });
  }

  const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating))));

  try {
    await ensureReviewsTables(db);

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newReview = {
      id: reviewId,
      product_id: productId,
      customer_id: customerId,
      author_name: body.author_name.trim(),
      rating,
      title: body.title.trim(),
      content: body.content.trim(),
      verified_purchase: Boolean(customerId),
      hardware_setup: body.hardware_setup ? body.hardware_setup.trim() : null,
      status: "APPROVED",
      created_at: new Date(),
    };

    await db("product_review").insert(newReview);

    return res.status(201).json({
      message: "Review submitted successfully",
      review: newReview,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return res.status(500).json({ error: "Failed to submit review" });
  }
}
