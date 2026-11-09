import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { orderPlacedEmail, sendEmail } from "../lib/email";

export default async function orderPlacedEmailHandler({ event, container }: SubscriberArgs<{ id: string }>) {
  const orderId = event.data?.id;
  if (!orderId) return;

  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "email", "display_id", "currency_code", "total"],
    filters: { id: orderId },
  });
  const order = orders?.[0] as any;
  if (!order?.email) return;

  const { subject, html } = orderPlacedEmail(order);
  await sendEmail(order.email, subject, html);
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
