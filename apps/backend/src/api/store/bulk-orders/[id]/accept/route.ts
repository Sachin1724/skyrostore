import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
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

    // Idempotency: If already accepted, return success immediately
    if (request.status === "ACCEPTED" || request.status === "CONVERTED_TO_ORDER") {
      return res.json({
        ok: true,
        status: request.status,
        message: "Quotation already accepted",
        request,
      });
    }

    // State machine: Only QUOTED requests can be accepted
    if (request.status !== "QUOTED") {
      return res.status(400).json({
        error: `Cannot accept quotation from status '${request.status}'. Request must be in 'QUOTED' status.`,
      });
    }

    // Check validity expiration
    if (request.quote_valid_until && new Date(request.quote_valid_until) < new Date()) {
      return res.status(400).json({
        error: "Quotation has expired. Please contact sales to request an updated quotation.",
      });
    }

    await db.transaction(async (trx: any) => {
      await trx("bulk_order_request")
        .where({ id })
        .update({
          status: "ACCEPTED",
          accepted_at: new Date(),
          updated_at: new Date(),
        });

      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await trx("bulk_order_audit_log").insert({
        id: logId,
        request_id: id,
        actor_type: "CUSTOMER",
        actor_id: customerId,
        action: "ACCEPTED",
        previous_status: "QUOTED",
        new_status: "ACCEPTED",
        message: `Quotation accepted by customer. Total: INR ${request.quote_total || 0}`,
        created_at: new Date(),
      });
    });

    const updated = await db("bulk_order_request").where({ id }).first();
    return res.json({
      ok: true,
      status: "ACCEPTED",
      message: "Quotation accepted successfully. Our engineering and fulfillment team will proceed with order scheduling.",
      request: updated,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: errorMsg });
  }
}
