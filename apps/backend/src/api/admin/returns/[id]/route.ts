import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ensureReviewsTables, type ReturnRequest } from "../../../../lib/reviews-db";
import { returnStatusEmail, sendEmail } from "../../../../lib/email";

const TRANSITIONS: Record<string, string[]> = {
  REQUESTED: ["APPROVED", "REJECTED"],
  APPROVED: ["COMPLETED", "REJECTED"],
  REJECTED: [],
  COMPLETED: [],
};

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const body = req.body as { status?: string; admin_note?: string };
  if (!body.status) return res.status(400).json({ error: "status is required" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  await ensureReviewsTables(db);

  const existing: ReturnRequest | undefined = await db("return_request").where({ id }).first();
  if (!existing) return res.status(404).json({ error: "Return request not found" });
  if (!(TRANSITIONS[existing.status] ?? []).includes(body.status)) {
    return res.status(400).json({ error: `Cannot move from ${existing.status} to ${body.status}` });
  }

  const updated = await db("return_request")
    .where({ id })
    .update({
      status: body.status,
      admin_note: body.admin_note ?? existing.admin_note,
      resolved_at: ["APPROVED", "REJECTED", "COMPLETED"].includes(body.status) ? new Date() : null,
    })
    .returning("*");

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: orders } = await query.graph({ entity: "order", fields: ["id", "email"], filters: { id: existing.order_id } });
  const email = (orders as any[])?.[0]?.email;
  if (email && (body.status === "APPROVED" || body.status === "REJECTED")) {
    const { subject, html } = returnStatusEmail(existing.display_id ?? existing.order_id, body.status as "APPROVED" | "REJECTED", body.admin_note);
    await sendEmail(email, subject, html);
  }

  return res.json({ ok: true, request: updated[0] });
}
