import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { cancelOrderWorkflow, refundPaymentWorkflow } from "@medusajs/medusa/core-flows";
import { deriveFulfilmentState } from "../../../../../lib/fulfilment";

// Ownership already checked by requireOrderOwner (see middlewares.ts). Customers
// may only self-cancel before anything has been packed — once a fulfillment
// exists, cancelOrderWorkflow itself refuses, so this is the same rule Medusa
// enforces, just checked early for a clearer error message.
const CANCELLABLE_STATES = ["awaiting_payment", "payment_failed", "paid_processing"];

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const customerId = (req as any).auth_context?.actor_id;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "status",
      "payment_status",
      "fulfillment_status",
      "fulfillments.canceled_at",
      "payment_collections.payments.id",
      "payment_collections.payments.amount",
      "payment_collections.payments.captured_at",
      "payment_collections.payments.canceled_at",
    ],
    filters: { id },
  });
  const order = (orders as any[])?.[0];
  if (!order) return res.status(404).json({ error: "Order not found" });

  const state = deriveFulfilmentState(order);
  if (!CANCELLABLE_STATES.includes(state)) {
    return res.status(400).json({ error: `This order can no longer be cancelled (currently "${state}"). Contact support.` });
  }

  try {
    await cancelOrderWorkflow(req.scope).run({ input: { order_id: id, canceled_by: customerId } });

    // Self-cancel is only allowed pre-pack; if a payment was already captured, refund it in full automatically.
    const payment = (order.payment_collections ?? [])
      .flatMap((pc: any) => pc.payments ?? [])
      .find((p: any) => p.captured_at && !p.canceled_at);
    if (payment) {
      try {
        await refundPaymentWorkflow(req.scope).run({
          input: { payment_id: payment.id, amount: payment.amount, created_by: customerId, note: "Customer self-cancellation" },
        });
      } catch (refundErr: unknown) {
        // The order is already cancelled; a refund failure needs a human, not a failed cancel response.
        console.error(`Auto-refund failed for cancelled order ${id}:`, refundErr instanceof Error ? refundErr.message : refundErr);
      }
    }

    return res.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
}
