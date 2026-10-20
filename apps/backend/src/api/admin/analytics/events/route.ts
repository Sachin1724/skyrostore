import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { EVENT_TYPES } from "../../../../lib/analytics";

/** Raw event drill-down behind the dashboard metrics. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const eventType = typeof req.query.event_type === "string" ? req.query.event_type : "";

  if (eventType && !(EVENT_TYPES as readonly string[]).includes(eventType)) {
    return res.status(400).json({ error: `Unknown event_type: ${eventType}` });
  }

  const filters: Record<string, string> = {};
  for (const key of ["session_id", "visitor_id", "cart_id", "order_id", "product_id", "customer_id"]) {
    const value = req.query[key];
    if (typeof value === "string" && value) filters[key] = value;
  }
  if (eventType) filters.event_type = eventType;

  try {
    const base = () => db("analytics_event").where(filters);
    const [rows, total] = await Promise.all([
      base().orderBy("occurred_at", "desc").limit(limit).offset(offset),
      base().count("id as count").first(),
    ]);

    return res.json({
      events: rows,
      count: Number((total as any)?.count || 0),
      limit,
      offset,
      filters,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
}
