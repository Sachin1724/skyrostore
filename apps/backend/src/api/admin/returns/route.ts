import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ensureReviewsTables, type ReturnRequest } from "../../../lib/reviews-db";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  await ensureReviewsTables(db);
  const status = req.query.status as string | undefined;

  let q = db("return_request").select("*").orderBy("created_at", "desc");
  if (status) q = q.where({ status });
  const requests: ReturnRequest[] = await q;
  return res.json({ count: requests.length, requests });
}
