import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Restricts `GET /store/orders/:id` to the customer who owns the order.
 *
 * Medusa ships this route unauthenticated on purpose, treating the order id as
 * a secret that must be brute forced. That is not good enough here: order ids
 * travel in confirmation links, logs and support tickets, and the order carries
 * the customer's name, address, phone and spend. This enforces ownership.
 *
 * A 404 is returned rather than a 403 so the route does not confirm that an
 * order id exists to someone who does not own it.
 */
export async function requireOrderOwner(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const customerId = (req as any).auth_context?.actor_id;
  const orderId = req.params?.id;

  if (!customerId) {
    return res.status(401).json({ error: "Authentication required to view an order." });
  }
  if (!orderId) {
    return next();
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    const { data } = await query.graph({
      entity: "order",
      fields: ["id", "customer_id"],
      filters: { id: orderId },
    });

    const order = (data as any[])?.[0];
    if (!order || order.customer_id !== customerId) {
      return res.status(404).json({ error: "Order not found" });
    }

    return next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
}
