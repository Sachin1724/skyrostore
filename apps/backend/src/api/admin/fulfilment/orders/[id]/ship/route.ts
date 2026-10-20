import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createOrderShipmentWorkflow, getOrderDetailWorkflow } from "@medusajs/medusa/core-flows";
import { canShip, deriveFulfilmentState, validateTracking } from "../../../../../../lib/fulfilment";
import { recordEvent } from "../../../../../../lib/analytics";

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
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
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

    const items = (pending.items || []).map((fi: any) => ({
      id: fi.line_item_id,
      quantity: Number(fi.quantity || 0),
    }));

    await createOrderShipmentWorkflow(req.scope).run({
      input: {
        order_id: id,
        fulfillment_id: pending.id,
        items,
        created_by: actorId,
        no_notification: false, // Customer gets the shipping notification here.
        labels: [
          {
            tracking_number: tracking.details.tracking_number,
            tracking_url: tracking.details.tracking_url || "",
            label_url: "",
          },
        ],
        metadata: {
          ...(pending.metadata || {}),
          courier: tracking.details.courier,
          shipped_by: actorId,
        },
      },
    });

    // The shipment workflow does not carry metadata onto the fulfilment, so the
    // courier is written directly; the tracking number lives on the label.
    try {
      const fulfilmentModule = req.scope.resolve(Modules.FULFILLMENT) as any;
      await fulfilmentModule.updateFulfillment(pending.id, {
        metadata: { ...(pending.metadata || {}), courier: tracking.details.courier, shipped_by: actorId },
      });
    } catch (err: unknown) {
      console.error("could not store courier on fulfilment:", err instanceof Error ? err.message : err);
    }

    await recordEvent(db, {
      event_type: "order_shipped",
      event_key: `fulfilment:shipped:${pending.id}`,
      session_id: `admin:${actorId}`,
      order_id: id,
      source: "admin_fulfilment",
      metadata: {
        action: "shipped",
        fulfillment_id: pending.id,
        courier: tracking.details.courier,
        tracking_number: tracking.details.tracking_number,
      },
    });

    return res.json({
      ok: true,
      fulfillment_id: pending.id,
      fulfilment_state: "shipped",
      courier: tracking.details.courier,
      tracking_number: tracking.details.tracking_number,
      notification_sent: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
}
