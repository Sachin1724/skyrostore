import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ensureReviewsTables } from "../../../lib/reviews-db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  try {
    await ensureReviewsTables(db);
    const exists = await db("newsletter_subscriber").where({ email }).first();
    if (!exists) {
      await db("newsletter_subscriber").insert({
        id: `nl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        email,
        created_at: new Date(),
      });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error saving newsletter subscriber:", error);
    return res.status(500).json({ error: "Failed to subscribe" });
  }
}
