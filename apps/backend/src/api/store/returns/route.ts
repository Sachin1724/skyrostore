import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ensureReviewsTables, type ReturnRequest } from "../../../lib/reviews-db";

const REASONS = ["DAMAGED", "DEFECTIVE", "WRONG_ITEM", "NOT_AS_DESCRIBED", "OTHER"];
const RESOLUTIONS = ["REFUND", "REPLACEMENT"];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id;
  if (!customerId) return res.status(401).json({ error: "Authentication required" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  await ensureReviewsTables(db);
  const requests: ReturnRequest[] = await db("return_request").where({ customer_id: customerId }).orderBy("created_at", "desc");
  return res.json({ requests });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id;
  if (!customerId) return res.status(401).json({ error: "Authentication required" });

  const body = req.body as { order_id?: string; reason?: string; description?: string; resolution?: string };
  if (!body.order_id || !body.reason || !body.description?.trim() || !body.resolution) {
    return res.status(400).json({ error: "order_id, reason, description and resolution are required" });
  }
  if (!REASONS.includes(body.reason)) return res.status(400).json({ error: "Unknown reason" });
  if (!RESOLUTIONS.includes(body.resolution)) return res.status(400).json({ error: "Unknown resolution" });

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "customer_id", "fulfillments.delivered_at"],
    filters: { id: body.order_id },
  });
  const order = (orders as any[])?.[0];
  if (!order || order.customer_id !== customerId) return res.status(404).json({ error: "Order not found" });
  const delivered = (order.fulfillments ?? []).some((f: any) => f.delivered_at);
  if (!delivered) return res.status(400).json({ error: "A return can only be requested once the order has been delivered." });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  await ensureReviewsTables(db);

  const existing = await db("return_request").where({ order_id: body.order_id, customer_id: customerId }).whereNotIn("status", ["REJECTED"]).first();
  if (existing) return res.status(409).json({ error: "A return request for this order is already in progress." });

  const id = `ret_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await db("return_request").insert({
    id,
    order_id: body.order_id,
    customer_id: customerId,
    display_id: order.display_id ? String(order.display_id) : null,
    reason: body.reason,
    description: body.description.trim(),
    resolution: body.resolution,
    status: "REQUESTED",
    created_at: new Date(),
  });

  return res.status(201).json({ ok: true, id });
}
