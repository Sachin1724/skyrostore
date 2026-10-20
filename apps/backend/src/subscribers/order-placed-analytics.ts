import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { recordEvent } from "../lib/analytics";

/**
 * Records `order_placed` from the commerce event rather than from the browser,
 * so the metric cannot be inflated or lost by the client. Runs after the order
 * exists, which also makes it the point where a paid order is known to be real.
 */
export default async function orderPlacedAnalyticsHandler({ event, container }: SubscriberArgs<{ id: string }>) {
  const orderId = event.data?.id;
  if (!orderId) return;

  const db = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "email", "customer_id", "currency_code", "total", "payment_status", "metadata"],
      filters: { id: orderId },
    });
    const order = (orders as any[])?.[0];
    if (!order) return;

    // Tie the order back to the browser session that checked out, when the
    // cart's events recorded one.
    const cartLink = await db("payment_attempt")
      .select("cart_id", "session_id", "visitor_id")
      .where({ order_id: orderId })
      .orderBy("attempted_at", "desc")
      .first()
      .catch(() => null);

    const sessionEvent = cartLink?.cart_id
      ? await db("analytics_event")
          .select("session_id", "visitor_id", "cart_id")
          .where({ cart_id: cartLink.cart_id })
          .orderBy("occurred_at", "desc")
          .first()
          .catch(() => null)
      : null;

    await recordEvent(db, {
      event_type: "order_placed",
      event_key: `order_placed:${orderId}`,
      session_id: cartLink?.session_id || sessionEvent?.session_id || `order:${orderId}`,
      visitor_id: cartLink?.visitor_id || sessionEvent?.visitor_id || null,
      cart_id: cartLink?.cart_id || sessionEvent?.cart_id || null,
      order_id: orderId,
      customer_id: order.customer_id || null,
      value: Number(order.total ?? 0),
      currency_code: order.currency_code || null,
      checkout_step: "complete",
      source: "server",
      metadata: {
        payment_status: order.payment_status,
        bulk_order_reference: order.metadata?.bulk_order_reference ?? null,
      },
    });

    if (cartLink?.cart_id) {
      await db("payment_attempt")
        .where({ cart_id: cartLink.cart_id })
        .whereNull("order_id")
        .update({ order_id: orderId, updated_at: new Date() })
        .catch(() => null);
    }
  } catch (err: unknown) {
    console.error("order_placed analytics failed:", err instanceof Error ? err.message : err);
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
