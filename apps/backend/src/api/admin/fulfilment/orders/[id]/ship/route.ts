import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getOrderDetailWorkflow } from "@medusajs/medusa/core-flows";
import {
  canShip,
  deriveFulfilmentState,
  validateTracking,
} from "../../../../../../lib/fulfilment";
import { markShipped } from "../../../../../../lib/ship";

const FIELDS = [
  "id",
  "status",
  "payment_status",
  "fulfillment_status",
  "items.id",
  "items.quantity",
  "items.detail.quantity",
  "items.detail.fulfilled_quantity",
  "items.detail.shipped_quantity",
  "fulfillments.id",
  "fulfillments.canceled_at",
  "fulfillments.shipped_at",
  "fulfillments.metadata",
  "fulfillments.items.line_item_id",
  "fulfillments.items.quantity",
  "fulfillments.labels.tracking_number",
];

/**
 * Adds courier and tracking details and moves the order to shipped.
 *
 * The transition is explicit: invalid or missing tracking details are rejected
 * and nothing changes. Repeating the call for an already-shipped fulfilment is
 * a no-op rather than a second shipment.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const actorId = (req as any).auth_context?.actor_id || "admin";

  const tracking = validateTracking((req.body || {}) as Record<string, unknown>);
  if ("error" in tracking) {
    return res.status(400).json({ error: tracking.error });
  }

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
    const pending = active.find((f: any) => !f.shipped_at);

    if (!canShip(state) || !pending) {
      const alreadyShipped = active.find((f: any) => f.shipped_at);
      if (alreadyShipped && ["shipped", "delivered"].includes(state)) {
        return res.json({
          ok: true,
          already_shipped: true,
          fulfilment_state: state,
          fulfillment_id: alreadyShipped.id,
          tracking_number: alreadyShipped.labels?.[0]?.tracking_number ?? null,
        });
      }
      return res.status(400).json({
        error: `Order cannot be shipped from state "${state}". Mark it packed first.`,
        fulfilment_state: state,
      });
    }

    await markShipped(req.scope, id, pending, tracking.details, actorId);

    return res.json({
      ok: true,
      fulfillment_id: pending.id,
      fulfilment_state: "shipped",
      courier: tracking.details.courier,
      tracking_number: tracking.details.tracking_number,
      notification_requested: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
}
