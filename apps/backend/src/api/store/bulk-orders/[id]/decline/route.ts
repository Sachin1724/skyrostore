import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id;
    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    const { reason } = (req.body as { reason?: string }) || {};
    const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

    const request = await db("bulk_order_request")
      .where({ id, customer_id: customerId })
      .first();

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.status === "CONVERTED_TO_ORDER") {
      return res.status(400).json({ error: "Cannot decline a request that has already been converted to an active order." });
    }

    if (request.status === "CANCELLED") {
      return res.json({ ok: true, status: "CANCELLED", message: "Request already cancelled." });
    }

    await db.transaction(async (trx: any) => {
      await trx("bulk_order_request")
        .where({ id })
        .update({
          status: "CANCELLED",
          rejection_reason: reason || "Declined by customer",
          updated_at: new Date(),
        });

      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await trx("bulk_order_audit_log").insert({
        id: logId,
        request_id: id,
        actor_type: "CUSTOMER",
        actor_id: customerId,
        action: "DECLINED",
        previous_status: request.status,
        new_status: "CANCELLED",
        message: `Customer declined quotation or cancelled request. Reason: ${reason || "No reason specified"}`,
        created_at: new Date(),
      });
    });

    const updated = await db("bulk_order_request").where({ id }).first();
    return res.json({
      ok: true,
      status: "CANCELLED",
      message: "Request cancelled.",
      request: updated,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: errorMsg });
  }
}
