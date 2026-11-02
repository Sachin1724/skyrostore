import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createOrderShipmentWorkflow } from "@medusajs/medusa/core-flows";
import type { TrackingDetails } from "./fulfilment";
import { recordEvent } from "./analytics";

/**
 * Runs the shipment workflow for a packed fulfilment and records the courier.
 * Shared by manual shipping and Shipmozo booking.
 */
export async function markShipped(
  scope: MedusaContainer,
  id: string,
  pending: any,
  details: TrackingDetails,
  actorId: string
) {
  const db = scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  const items = (pending.items || []).map((fi: any) => ({
    id: fi.line_item_id,
    quantity: Number(fi.quantity || 0),
  }));

  await createOrderShipmentWorkflow(scope).run({
    input: {
      order_id: id,
      fulfillment_id: pending.id,
      items,
      created_by: actorId,
      no_notification: false, // Customer gets the shipping notification here.
      labels: [
        {
          tracking_number: details.tracking_number,
          tracking_url: details.tracking_url || "",
          label_url: "",
        },
      ],
      metadata: {
        ...(pending.metadata || {}),
        courier: details.courier,
        shipped_by: actorId,
      },
    },
  });

  // The shipment workflow does not carry metadata onto the fulfilment, so the
  // courier is written directly; the tracking number lives on the label.
  try {
    const fulfilmentModule = scope.resolve(Modules.FULFILLMENT) as any;
    await fulfilmentModule.updateFulfillment(pending.id, {
      metadata: { ...(pending.metadata || {}), courier: details.courier, shipped_by: actorId },
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
      courier: details.courier,
      tracking_number: details.tracking_number,
    },
  });
}
