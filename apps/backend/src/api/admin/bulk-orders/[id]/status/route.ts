import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { isValidTransition, BulkOrderStatus } from "../../../../../lib/bulk-orders";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;
    const { status, admin_notes, rejection_reason } = req.body as {
      status: BulkOrderStatus;
      admin_notes?: string;
      rejection_reason?: string;
    };

    if (!status) {
      return res.status(400).json({ error: "Target status is required" });
    }

    const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
    const request = await db("bulk_order_request").where({ id }).first();

    if (!request) {
      return res.status(404).json({ error: "Bulk order request not found" });
    }

    const currentStatus = request.status as BulkOrderStatus;

    if (!isValidTransition(currentStatus, status)) {
      return res.status(400).json({
        error: `Invalid status transition from '${currentStatus}' to '${status}'.`,
      });
    }

    await db.transaction(async (trx: any) => {
      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date(),
      };
      if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
      if (rejection_reason !== undefined) updateData.rejection_reason = rejection_reason;
      if (status === "REJECTED") updateData.rejected_at = new Date();

      await trx("bulk_order_request").where({ id }).update(updateData);

      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await trx("bulk_order_audit_log").insert({
        id: logId,
        request_id: id,
        actor_type: "ADMIN",
        actor_id: (req as any).auth_context?.actor_id || "admin",
        action: "STATUS_CHANGE",
        previous_status: currentStatus,
        new_status: status,
        message: `Admin changed status from '${currentStatus}' to '${status}'. ${admin_notes ? `Notes: ${admin_notes}` : ""}`,
        created_at: new Date(),
      });
    });

    const updated = await db("bulk_order_request").where({ id }).first();
    return res.json({ ok: true, request: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: errorMsg });
  }
}
