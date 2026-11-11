import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ensureReviewsTables } from "../../../../../lib/reviews-db";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id: productId } = req.params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

  try {
    await ensureReviewsTables(db);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const questions = await db("product_question")
      .where({ product_id: productId })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .andWhere((q: any) => {
        q.where({ status: "APPROVED" }).orWhereNotNull("answer");
      })
      .orderBy("created_at", "desc");

    return res.status(200).json({
      product_id: productId,
      total_questions: questions.length,
      questions,
    });
  } catch (error) {
    console.error("Error fetching product questions:", error);
    return res.status(500).json({ error: "Failed to retrieve questions" });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id: productId } = req.params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  const customerId = (req as unknown as { auth_context?: { actor_id?: string } }).auth_context?.actor_id || null;

  const body = req.body as {
    author_name?: string;
    question?: string;
  };

  if (!body.author_name || !body.question) {
    return res.status(400).json({ error: "Author name and question text are required" });
  }

  try {
    await ensureReviewsTables(db);

    const questionId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newQuestion = {
      id: questionId,
      product_id: productId,
      customer_id: customerId,
      author_name: body.author_name.trim(),
      question: body.question.trim(),
      answer: null,
      answered_by: null,
      status: "APPROVED",
      created_at: new Date(),
      answered_at: null,
    };

    await db("product_question").insert(newQuestion);

    return res.status(201).json({
      message: "Question submitted successfully",
      question: newQuestion,
    });
  } catch (error) {
    console.error("Error creating question:", error);
    return res.status(500).json({ error: "Failed to submit question" });
  }
}
