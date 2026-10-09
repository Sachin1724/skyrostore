import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;
    const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

    const request = await db("bulk_order_request").where({ id }).first();
    if (!request) {
      return res.status(404).json({ error: "Bulk order request not found" });
    }

    // Idempotency: If already converted, return existing order reference
    if (request.status === "CONVERTED_TO_ORDER" && request.linked_order_id) {
      return res.json({
        ok: true,
        already_converted: true,
        order_id: request.linked_order_id,
        request,
      });
    }

    // State machine: Only ACCEPTED quotes may be converted to an order
    if (request.status !== "ACCEPTED") {
      return res.status(400).json({
        error: `Cannot convert request to order. Status must be 'ACCEPTED', but is currently '${request.status}'.`,
      });
    }

    const orderReferenceId = `ord_bulk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await db.transaction(async (trx: any) => {
      await trx("bulk_order_request")
        .where({ id })
        .update({
          status: "CONVERTED_TO_ORDER",
          linked_order_id: orderReferenceId,
          converted_at: new Date(),
          updated_at: new Date(),
        });

      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await trx("bulk_order_audit_log").insert({
        id: logId,
        request_id: id,
        actor_type: "ADMIN",
        actor_id: (req as any).auth_context?.actor_id || "admin",
        action: "CONVERTED_TO_ORDER",
        previous_status: "ACCEPTED",
        new_status: "CONVERTED_TO_ORDER",
        message: `Accepted quotation successfully converted to production/commercial order ID: ${orderReferenceId}`,
        created_at: new Date(),
      });
    });

    const updated = await db("bulk_order_request").where({ id }).first();
    return res.json({
      ok: true,
      order_id: orderReferenceId,
      message: `Bulk request converted to order ${orderReferenceId}.`,
      request: updated,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: errorMsg });
  }
}
