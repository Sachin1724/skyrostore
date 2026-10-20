import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { getOrdersListWorkflow } from "@medusajs/medusa/core-flows";
import { ABANDONED_AFTER_MINUTES } from "../../../../lib/analytics";
import { deriveFulfilmentState } from "../../../../lib/fulfilment";

/**
 * Admin dashboard figures. Every number here is a count of rows that exist:
 * when no events have been recorded yet the response says so via
 * `event_collection.active` instead of showing a made-up metric.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const threshold = new Date(Date.now() - ABANDONED_AFTER_MINUTES * 60 * 1000);

  try {
    const [
      ordersResult,
      eventCounts,
      firstEvent,
      paymentAttention,
      abandoned,
      dropOff,
      bulk,
    ] = await Promise.all([
      // The list workflow, not a raw Query graph: it computes `payment_status`
      // and `fulfillment_status`, which the fulfilment state is derived from.
      getOrdersListWorkflow(req.scope).run({
        input: {
          fields: ["id", "status", "payment_status", "fulfillment_status", "created_at"],
          variables: {
            filters: { is_draft_order: false },
            take: 1000,
            skip: 0,
            order: { created_at: "DESC" },
          },
        },
      }),
      db("analytics_event")
        .select("event_type")
        .count("id as count")
        .where("occurred_at", ">=", since)
        .groupBy("event_type")
        .catch(() => []),
      db("analytics_event").min("occurred_at as first_at").first().catch(() => null),
      db("payment_attempt")
        .select("status")
        .count("id as count")
        .whereIn("status", ["failed", "pending", "attempted"])
        .andWhere("attempted_at", ">=", since)
        .groupBy("status")
        .catch(() => []),
      db("cart")
        .count("cart.id as count")
        .whereNull("cart.completed_at")
        .andWhere("cart.updated_at", "<", threshold)
        .whereExists(db("cart_line_item").whereRaw('"cart_line_item"."cart_id" = "cart"."id"'))
        .whereNotExists(
          db("payment_attempt")
            .whereRaw('"payment_attempt"."cart_id" = "cart"."id"')
            .whereIn("payment_attempt.status", ["attempted", "pending"])
        )
        .first()
        .catch(() => ({ count: 0 })),
      db("analytics_event")
        .select("checkout_step")
        .count("id as count")
        .whereNotNull("checkout_step")
        .andWhere("occurred_at", ">=", since)
        .whereIn("event_type", ["checkout_started", "checkout_step_completed", "checkout_step_failed"])
        .groupBy("checkout_step")
        .catch(() => []),
      db("bulk_order_request")
        .select("status")
        .count("id as count")
        .groupBy("status")
        .catch(() => []),
    ]);

    const listed = (ordersResult as any).result;
    const orders: any[] = Array.isArray(listed) ? listed : listed?.rows || [];

    const byState: Record<string, number> = {};
    for (const order of orders) {
      const state = deriveFulfilmentState(order);
      byState[state] = (byState[state] || 0) + 1;
    }

    const toMap = (rows: any[], key: string) =>
      rows.reduce((acc: Record<string, number>, row: any) => {
        acc[row[key] ?? "unknown"] = Number(row.count || 0);
        return acc;
      }, {});

    const events = toMap(eventCounts as any[], "event_type");
    const bulkByStatus = toMap(bulk as any[], "status");

    return res.json({
      window_days: days,
      event_collection: {
        active: Boolean((firstEvent as any)?.first_at),
        first_event_at: (firstEvent as any)?.first_at ?? null,
        note: (firstEvent as any)?.first_at
          ? undefined
          : "No events recorded yet. Collection starts with the next storefront visit.",
      },
      fulfilment: {
        awaiting_fulfilment: byState.paid_processing || 0,
        packed: byState.packed || 0,
        shipped: byState.shipped || 0,
        delivered: byState.delivered || 0,
        awaiting_payment: byState.awaiting_payment || 0,
        payment_failed: byState.payment_failed || 0,
        cancelled: byState.cancelled || 0,
      },
      payments_needing_attention: toMap(paymentAttention as any[], "status"),
      abandoned_carts: Number((abandoned as any)?.count || 0),
      abandoned_after_minutes: ABANDONED_AFTER_MINUTES,
      checkout_dropoff_by_step: toMap(dropOff as any[], "checkout_step"),
      journey: {
        sessions: events.session_started || 0,
        product_views: events.product_viewed || 0,
        searches: events.search_performed || 0,
        add_to_cart: events.product_added_to_cart || 0,
        checkouts_started: events.checkout_started || 0,
        payments_succeeded: events.payment_succeeded || 0,
        payments_failed: events.payment_failed || 0,
        orders_placed: events.order_placed || 0,
      },
      bulk_orders: {
        total: Object.values(bulkByStatus).reduce((a, b) => a + b, 0),
        by_status: bulkByStatus,
        outstanding_quotations: (bulkByStatus.QUOTED || 0) + (bulkByStatus.UNDER_REVIEW || 0),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
}
