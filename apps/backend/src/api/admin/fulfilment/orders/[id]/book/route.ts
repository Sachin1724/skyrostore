import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { getOrderDetailWorkflow } from "@medusajs/medusa/core-flows";
import { deriveFulfilmentState } from "../../../../../../lib/fulfilment";
import { markShipped } from "../../../../../../lib/ship";
import {
  autoAssign,
  buildPushOrder,
  pushOrder,
  schedulePickup,
  shipmozoConfigured,
  validatePackage,
  warehouseId,
} from "../../../../../../lib/shipmozo";

const FIELDS = [
  "id",
  "email",
  "created_at",
  "status",
  "payment_status",
  "fulfillment_status",
  "shipping_address.*",
  "items.id",
  "items.title",
  "items.variant_title",
  "items.variant_sku",
  "items.unit_price",
  "items.quantity",
  "items.metadata",
  "items.detail.quantity",
  "fulfillments.id",
  "fulfillments.canceled_at",
  "fulfillments.shipped_at",
  "fulfillments.metadata",
  "fulfillments.items.line_item_id",
  "fulfillments.items.quantity",
  "fulfillments.labels.tracking_number",
];

/**
 * One click after packing: pushes the order to Shipmozo, lets the panel's
 * auto-assign rule book the courier (Delhivery), stores the AWB, and moves the
 * order to shipped so the customer gets tracking.
 *
 * Safe to retry: the AWB is saved on the fulfilment as soon as it exists, so a
 * failure after booking never books a second courier.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const actorId = (req as any).auth_context?.actor_id || "admin";

  if (!shipmozoConfigured()) {
    return res.status(400).json({ error: "Shipmozo is not configured. Set SHIPMOZO_PUBLIC_KEY and SHIPMOZO_PRIVATE_KEY." });
  }

  try {
    let order: any;
    try {
      const { result } = await getOrderDetailWorkflow(req.scope).run({ input: { order_id: id, fields: FIELDS } });
      order = result;
    } catch {
      order = null;
    }
    if (!order) return res.status(404).json({ error: "Order not found" });

    const state = deriveFulfilmentState(order);
    const active = (order.fulfillments || []).filter((f: any) => !f.canceled_at);
    const booked = active.find((f: any) => f.metadata?.shipmozo_awb);
    if (["shipped", "delivered"].includes(state) && booked) {
      return res.json({ ok: true, already_booked: true, awb: booked.metadata.shipmozo_awb, courier: booked.metadata.courier });
    }

    const pending = active.find((f: any) => !f.shipped_at);
    if (state !== "packed" || !pending) {
      return res.status(400).json({ error: `Order must be packed before booking a courier (currently "${state}").` });
    }

    let awb: string = pending.metadata?.shipmozo_awb || "";
    let courier: string = pending.metadata?.courier || "";

    if (!awb) {
      const parsed = validatePackage((req.body || {}) as Record<string, unknown>);
      if ("error" in parsed) return res.status(400).json({ error: parsed.error });

      const body = buildPushOrder(order, parsed.pkg, await warehouseId());
      try {
        await pushOrder(body);
      } catch (err: unknown) {
        // A retry after a failed assign: the order is already in the panel.
        if (!/already|exist|duplicate/i.test(err instanceof Error ? err.message : "")) throw err;
      }

      const assigned = await autoAssign(order.id);
      awb = String(assigned.awb_number || "");
      courier = assigned.courier_company || "Courier";
      if (!awb) throw new Error("Shipmozo assigned a courier but returned no AWB number");

      const metadata = { ...(pending.metadata || {}), shipmozo_awb: awb, courier, package: parsed.pkg };
      await (req.scope.resolve(Modules.FULFILLMENT) as any).updateFulfillment(pending.id, { metadata });
      pending.metadata = metadata;

      // Only needed when the courier does not auto-schedule; a refusal is harmless.
      await schedulePickup(order.id).catch((err) =>
        console.warn("shipmozo schedule-pickup:", err instanceof Error ? err.message : err)
      );
    }

    await markShipped(
      req.scope,
      id,
      pending,
      {
        courier,
        tracking_number: awb,
        ...(/delhivery/i.test(courier) ? { tracking_url: `https://www.delhivery.com/track/package/${awb}` } : {}),
      },
      actorId
    );

    return res.json({ ok: true, awb, courier, fulfilment_state: "shipped" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
}
