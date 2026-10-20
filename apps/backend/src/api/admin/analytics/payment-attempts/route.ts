import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Payment attempts for failure investigation. These rows are observational:
 * the payment module remains authoritative for whether an order is paid.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const filters: Record<string, string> = {};
  for (const key of ["status", "cart_id", "order_id", "provider_id", "provider_reference"]) {
    const value = req.query[key];
    if (typeof value === "string" && value) filters[key] = value;
  }

  try {
    const base = () => db("payment_attempt").where(filters);
    const [rows, total, byCategory] = await Promise.all([
      base().orderBy("attempted_at", "desc").limit(limit).offset(offset),
      base().count("id as count").first(),
      db("payment_attempt")
        .select("error_category")
        .count("id as count")
        .where({ status: "failed" })
        .groupBy("error_category"),
    ]);

    return res.json({
      attempts: rows,
      count: Number((total as any)?.count || 0),
      limit,
      offset,
      filters,
      failures_by_category: (byCategory as any[]).reduce((acc: Record<string, number>, row: any) => {
        acc[row.error_category || "unknown"] = Number(row.count || 0);
        return acc;
      }, {}),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
}
