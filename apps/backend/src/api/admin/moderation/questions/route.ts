import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ensureReviewsTables, type ProductQuestion } from "../../../../lib/reviews-db";
import { lookupProducts } from "../../../../lib/product-lookup";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  const status = req.query.status as string | undefined;

  try {
    await ensureReviewsTables(db);

    let q = db("product_question").select("*").orderBy("created_at", "desc");
    if (status) q = q.where({ status });

    const questions: ProductQuestion[] = await q;
    const products = await lookupProducts(req, [...new Set(questions.map((r) => r.product_id))]);
    const enriched = questions.map((r) => ({ ...r, product: products.get(r.product_id) ?? null }));
    return res.status(200).json({ count: questions.length, questions: enriched });
  } catch (error) {
    console.error("Error fetching admin questions:", error);
    return res.status(500).json({ error: "Failed to load questions" });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  const body = req.body as {
    question_id?: string;
    answer?: string;
    answered_by?: string;
    status?: "APPROVED" | "REJECTED" | "PENDING";
  };

  if (!body.question_id) {
    return res.status(400).json({ error: "question_id is required" });
  }

  try {
    await ensureReviewsTables(db);

    const updateData: Record<string, unknown> = {};
    if (body.answer !== undefined) {
      updateData.answer = body.answer.trim();
      updateData.answered_by = body.answered_by || "Skyrostore Engineering Team";
      updateData.answered_at = new Date();
      updateData.status = "APPROVED";
    }
    if (body.status) {
      updateData.status = body.status;
    }

    const updated = await db("product_question")
      .where({ id: body.question_id })
      .update(updateData)
      .returning("*");

    return res.status(200).json({ success: true, question: updated[0] });
  } catch (error) {
    console.error("Error answering question:", error);
    return res.status(500).json({ error: "Failed to answer question" });
  }
}
