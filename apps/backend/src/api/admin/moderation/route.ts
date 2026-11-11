import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ensureReviewsTables } from "../../../lib/reviews-db";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

  try {
    await ensureReviewsTables(db);

    const pendingReviews = await db("product_review").where({ status: "PENDING" }).count("id as count");
    const pendingQuestions = await db("product_question").whereNull("answer").count("id as count");
    const totalReviews = await db("product_review").count("id as count");
    const totalQuestions = await db("product_question").count("id as count");

    return res.status(200).json({
      pending_reviews: Number(pendingReviews[0]?.count || 0),
      pending_questions: Number(pendingQuestions[0]?.count || 0),
      total_reviews: Number(totalReviews[0]?.count || 0),
      total_questions: Number(totalQuestions[0]?.count || 0),
      endpoints: {
        reviews: "/admin/moderation/reviews",
        questions: "/admin/moderation/questions",
      },
    });
  } catch (error) {
    console.error("Error loading moderation dashboard:", error);
    return res.status(500).json({ error: "Failed to load moderation metrics" });
  }
}
