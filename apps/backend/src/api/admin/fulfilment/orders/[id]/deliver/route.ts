import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getOrderDetailWorkflow, markOrderFulfillmentAsDeliveredWorkflow } from "@medusajs/medusa/core-flows";
import { deriveFulfilmentState } from "../../../../../../lib/fulfilment";

const FIELDS = [
  "id",
  "status",
  "payment_status",
  "fulfillment_status",
  "fulfillments.id",
  "fulfillments.canceled_at",
  "fulfillments.shipped_at",
  "fulfillments.delivered_at",
];

/** Confirms delivery. Idempotent. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  try {
    let order: any;
    try {
      const { result } = await getOrderDetailWorkflow(req.scope).run({
        input: { order_id: id, fields: FIELDS },
      });
      order = result;
    } catch {
      order = null;
    }
    if (!order) return res.status(404).json({ error: "Order not found" });

    const state = deriveFulfilmentState(order);
    const active = (order.fulfillments || []).filter((f: any) => !f.canceled_at);
    const shipped = active.find((f: any) => f.shipped_at && !f.delivered_at);

    if (!shipped) {
      if (state === "delivered") {
        return res.json({ ok: true, already_delivered: true, fulfilment_state: state });
      }
      return res.status(400).json({
        error: `Order cannot be marked delivered from state "${state}". Ship it first.`,
        fulfilment_state: state,
      });
    }

    await markOrderFulfillmentAsDeliveredWorkflow(req.scope).run({
      input: { orderId: id, fulfillmentId: shipped.id, no_notification: false },
    });

    return res.json({ ok: true, fulfillment_id: shipped.id, fulfilment_state: "delivered" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
}
