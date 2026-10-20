import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ABANDONED_AFTER_MINUTES, classifyCart } from "../../../../lib/analytics";

/**
 * Carts with recorded activity and no completed order.
 *
 * Classification is time-based and comes from `classifyCart`: a cart only
 * counts as abandoned once it has been idle past the configured threshold and
 * has no payment still in flight. The reason a customer left is not recorded,
 * so none is reported — only the last action and last completed checkout step.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const stateFilter = typeof req.query.state === "string" ? req.query.state : "";
  const thresholdMinutes = Math.min(
    Math.max(Number(req.query.threshold_minutes) || ABANDONED_AFTER_MINUTES, 1),
    60 * 24 * 30
  );

  try {
    const rows = await db("cart as c")
      .select(
        "c.id",
        "c.email",
        "c.customer_id",
        "c.currency_code",
        "c.created_at",
        "c.updated_at",
        "c.completed_at"
      )
      .select(
        db.raw('(select count(*) from cart_line_item li where li.cart_id = c.id) as item_count'),
        db.raw('(select max(occurred_at) from analytics_event e where e.cart_id = c.id) as last_event_at'),
        db.raw(
          "(select event_type from analytics_event e where e.cart_id = c.id order by occurred_at desc limit 1) as last_event_type"
        ),
        db.raw(
          "(select checkout_step from analytics_event e where e.cart_id = c.id and e.checkout_step is not null order by occurred_at desc limit 1) as last_checkout_step"
        ),
        db.raw(
          "(select count(*) from payment_attempt p where p.cart_id = c.id and p.status in ('attempted','pending')) as pending_payments"
        ),
        db.raw(
          "(select count(*) from payment_attempt p where p.cart_id = c.id and p.status = 'failed') as failed_payments"
        )
      )
      .whereNull("c.completed_at")
      .whereNull("c.deleted_at")
      .orderBy("c.updated_at", "desc")
      .limit(1000);

    const now = new Date();
    const classified = (rows as any[])
      .filter((row) => Number(row.item_count || 0) > 0 || row.last_event_at)
      .map((row) => {
        const lastActivity =
          row.last_event_at && new Date(row.last_event_at) > new Date(row.updated_at)
            ? row.last_event_at
            : row.updated_at;
        const state = classifyCart(
          {
            cart_id: row.id,
            completed_order_id: row.completed_at ? row.id : null,
            last_activity_at: lastActivity,
            last_checkout_step: row.last_checkout_step,
            has_pending_payment: Number(row.pending_payments || 0) > 0,
          },
          now,
          thresholdMinutes
        );
        return {
          cart_id: row.id,
          email: row.email,
          customer_id: row.customer_id,
          currency_code: row.currency_code,
          item_count: Number(row.item_count || 0),
          created_at: row.created_at,
          last_activity_at: lastActivity,
          idle_minutes: Math.round((now.getTime() - new Date(lastActivity).getTime()) / 60000),
          last_action: row.last_event_type || null,
          last_checkout_step: row.last_checkout_step || null,
          failed_payments: Number(row.failed_payments || 0),
          pending_payments: Number(row.pending_payments || 0),
          state,
        };
      });

    const counts = classified.reduce((acc: Record<string, number>, row) => {
      acc[row.state] = (acc[row.state] || 0) + 1;
      return acc;
    }, {});

    const filtered = stateFilter
      ? classified.filter((row) => row.state === stateFilter)
      : classified.filter((row) => row.state.startsWith("abandoned"));

    return res.json({
      carts: filtered.slice(offset, offset + limit),
      count: filtered.length,
      limit,
      offset,
      counts_by_state: counts,
      threshold_minutes: thresholdMinutes,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
}
