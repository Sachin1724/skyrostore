import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ensureReviewsTables } from "../../../lib/reviews-db";

/** Restock-alert sign-ups from the storefront's "Get restock alerts" form, newest first. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  await ensureReviewsTables(db);
  const subscribers = await db("newsletter_subscriber").select("email", "created_at").orderBy("created_at", "desc").limit(5000);
  res.json({ subscribers });
}
