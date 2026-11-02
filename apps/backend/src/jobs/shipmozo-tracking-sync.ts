import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { markOrderFulfillmentAsDeliveredWorkflow } from "@medusajs/medusa/core-flows";
import { isDeliveredStatus, shipmozoConfigured, trackOrder } from "../lib/shipmozo";

/** Marks Shipmozo-booked shipments delivered once the courier reports delivery. */
export default async function shipmozoTrackingSync(container: MedusaContainer) {
  if (!shipmozoConfigured()) return;
  const db = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

  // ponytail: sequential polling, fine for hundreds of in-transit parcels a day;
  // switch to a Shipmozo webhook if volume outgrows a 30 minute sweep.
  const rows = await db("order_fulfillment as of")
    .join("fulfillment as f", "f.id", "of.fulfillment_id")
    .whereNull("of.deleted_at")
    .whereNotNull("f.shipped_at")
    .whereNull("f.delivered_at")
    .whereNull("f.canceled_at")
    .whereRaw("f.metadata->>'shipmozo_awb' is not null")
    .select("of.order_id", "f.id as fulfillment_id", db.raw("f.metadata->>'shipmozo_awb' as awb"));

  for (const row of rows) {
    try {
      const tracking = await trackOrder(row.awb);
      if (!isDeliveredStatus(tracking.current_status)) continue;
      await markOrderFulfillmentAsDeliveredWorkflow(container).run({
        input: { orderId: row.order_id, fulfillmentId: row.fulfillment_id, no_notification: false },
      });
    } catch (err: unknown) {
      console.warn(`shipmozo tracking ${row.awb}:`, err instanceof Error ? err.message : err);
    }
  }
}

export const config = { name: "shipmozo-tracking-sync", schedule: "*/30 * * * *" };
