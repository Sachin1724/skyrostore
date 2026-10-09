import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id;
    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

    const request = await db("bulk_order_request")
      .where({ id, customer_id: customerId })
      .first();

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    const [items, logs] = await Promise.all([
      db("bulk_order_line_item").where({ request_id: id }).orderBy("created_at", "asc"),
      db("bulk_order_audit_log").where({ request_id: id }).orderBy("created_at", "desc"),
    ]);

    return res.json({ request: { ...request, items, audit_logs: logs } });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: errorMsg });
  }
}
