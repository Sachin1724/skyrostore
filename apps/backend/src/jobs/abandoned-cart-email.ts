import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ABANDONED_AFTER_MINUTES, classifyCart } from "../lib/analytics";
import { ensureReviewsTables } from "../lib/reviews-db";
import { abandonedCartEmail, sendEmail } from "../lib/email";

/**
 * One recovery email per cart, ever — the abandoned_cart_email_sent table is
 * the dedupe guard. Same abandonment definition as the admin analytics view
 * (lib/analytics.ts classifyCart), so "abandoned" means the same thing in
 * both places.
 */
export default async function abandonedCartEmailJob(container: MedusaContainer) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  await ensureReviewsTables(db);

  const rows = await db("cart as c")
    .select("c.id", "c.email")
    .select(
      db.raw("(select count(*) from cart_line_item li where li.cart_id = c.id) as item_count"),
      db.raw("(select max(occurred_at) from analytics_event e where e.cart_id = c.id) as last_event_at"),
      db.raw(
        "(select checkout_step from analytics_event e where e.cart_id = c.id and e.checkout_step is not null order by occurred_at desc limit 1) as last_checkout_step"
      ),
      db.raw(
        "(select count(*) from payment_attempt p where p.cart_id = c.id and p.status in ('attempted','pending')) as pending_payments"
      )
    )
    .whereNull("c.completed_at")
    .whereNull("c.deleted_at")
    .whereNotNull("c.email")
    .whereNotExists(function (this: any) {
      this.select("*").from("abandoned_cart_email_sent").whereRaw("abandoned_cart_email_sent.cart_id = c.id");
    })
    .orderBy("c.updated_at", "desc")
    .limit(500);

  const now = new Date();
  const storefrontUrl = process.env.STOREFRONT_URL || "http://localhost:3000";

  for (const row of rows as any[]) {
    if (Number(row.item_count || 0) === 0) continue;
    const state = classifyCart(
      {
        cart_id: row.id,
        last_activity_at: row.last_event_at,
        last_checkout_step: row.last_checkout_step,
        has_pending_payment: Number(row.pending_payments || 0) > 0,
      },
      now,
      ABANDONED_AFTER_MINUTES
    );
    if (!state.startsWith("abandoned")) continue;

    try {
      const { subject, html } = abandonedCartEmail(`${storefrontUrl}/cart?cart_id=${row.id}`, Number(row.item_count));
      await sendEmail(row.email, subject, html);
      await db("abandoned_cart_email_sent").insert({ cart_id: row.id, sent_at: new Date() }).onConflict("cart_id").ignore();
    } catch (err: unknown) {
      console.error(`abandoned-cart-email for cart ${row.id}:`, err instanceof Error ? err.message : err);
    }
  }
}

export const config = { name: "abandoned-cart-email", schedule: "*/15 * * * *" };
