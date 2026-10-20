import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createOrderFulfillmentWorkflow, getOrderDetailWorkflow } from "@medusajs/medusa/core-flows";
import { canPack, deriveFulfilmentState } from "../../../../../../lib/fulfilment";
import { recordEvent } from "../../../../../../lib/analytics";

const FIELDS = [
  "id",
  "status",
  "payment_status",
  "fulfillment_status",
  "metadata",
  "items.id",
  "items.quantity",
  "items.detail.quantity",
  "items.detail.fulfilled_quantity",
  "fulfillments.id",
  "fulfillments.canceled_at",
  "fulfillments.packed_at",
];

/**
 * Marks the order packed by creating a fulfilment for the unfulfilled items.
 * Idempotent: a second call on an already-packed order changes nothing.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  const actorId = (req as any).auth_context?.actor_id || "admin";

  try {
    // The order must come from this workflow: it computes `payment_status` and
    // `fulfillment_status`, which the operational state is derived from.
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
    const activeFulfilments = (order.fulfillments || []).filter((f: any) => !f.canceled_at);

    // Bulk orders converted from a quotation are invoiced, so packing may start
    // before payment is captured — but only when the operator asks for it.
    const invoicedBulkOrder =
      state === "awaiting_payment" &&
      order.metadata?.payment_terms === "invoice" &&
      (req.body as any)?.allow_unpaid === true;

    if (!canPack(state) && !invoicedBulkOrder) {
      if (["packed", "shipped", "delivered"].includes(state)) {
        return res.json({
          ok: true,
          already_packed: true,
          fulfilment_state: state,
          fulfillment_id: activeFulfilments[0]?.id ?? null,
        });
      }
      return res.status(400).json({
        error: `Order cannot be packed from state "${state}". It must be paid and awaiting fulfilment.`,
        fulfilment_state: state,
      });
    }

    const items = (order.items || [])
      .map((item: any) => ({
        id: item.id,
        // An order item's quantity is served from its `detail` relation; the
        // flat `quantity` is only present when the whole item is selected.
        quantity:
          Number(item.quantity ?? item.detail?.quantity ?? 0) -
          Number(item.detail?.fulfilled_quantity ?? 0),
      }))
      .filter((item: any) => item.quantity > 0);

    if (!items.length) {
      return res.json({ ok: true, already_packed: true, fulfilment_state: state });
    }

    const { result } = await createOrderFulfillmentWorkflow(req.scope).run({
      input: {
        order_id: id,
        items,
        created_by: actorId,
        no_notification: true, // The customer is notified when it actually ships.
        ...(typeof (req.body as any)?.location_id === "string"
          ? { location_id: (req.body as any).location_id }
          : {}),
        metadata: { packed_by: actorId },
      },
    });

    await recordEvent(db, {
      event_type: "order_packed",
      event_key: `fulfilment:packed:${(result as any)?.id || id}`,
      session_id: `admin:${actorId}`,
      order_id: id,
      source: "admin_fulfilment",
      metadata: { action: "packed", fulfillment_id: (result as any)?.id ?? null },
    });

    return res.json({
      ok: true,
      fulfillment_id: (result as any)?.id ?? null,
      packed_items: items,
      fulfilment_state: "packed",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
}
