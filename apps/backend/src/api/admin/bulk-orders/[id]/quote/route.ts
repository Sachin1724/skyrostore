import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { z } from "zod";

const quoteItemSchema = z.object({
  id: z.string(),
  quoted_unit_price: z.number().min(0, "Unit price must be non-negative"),
});

const issueQuoteSchema = z.object({
  items: z.array(quoteItemSchema).min(1, "At least one quoted line item is required"),
  quote_shipping: z.number().min(0).default(0),
  quote_tax: z.number().min(0).default(0),
  quote_valid_until: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format for validity"),
  quote_notes: z.string().optional().nullable(),
  admin_notes: z.string().optional().nullable(),
});

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;
    const parseResult = issueQuoteSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid quotation data",
        details: parseResult.error.flatten(),
      });
    }

    const data = parseResult.data;
    const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

    const request = await db("bulk_order_request").where({ id }).first();
    if (!request) {
      return res.status(404).json({ error: "Bulk order request not found" });
    }

    if (request.status === "CONVERTED_TO_ORDER") {
      return res.status(400).json({ error: "Cannot re-quote a request that has already been converted to an order." });
    }

    const currentItems = await db("bulk_order_line_item").where({ request_id: id });
    const itemMap = new Map<string, any>(currentItems.map((i: any) => [i.id, i]));

    let calculatedSubtotal = 0;

    await db.transaction(async (trx: any) => {
      // 1. Update line item pricing
      for (const qItem of data.items) {
        const existing = itemMap.get(qItem.id);
        if (!existing) continue;

        const lineTotal = Number(qItem.quoted_unit_price) * Number(existing.requested_quantity);
        calculatedSubtotal += lineTotal;

        await trx("bulk_order_line_item")
          .where({ id: qItem.id, request_id: id })
          .update({
            quoted_unit_price: qItem.quoted_unit_price,
            quoted_total: lineTotal,
          });
      }

      const quoteShipping = Number(data.quote_shipping) || 0;
      const quoteTax = Number(data.quote_tax) || 0;
      const grandTotal = calculatedSubtotal + quoteShipping + quoteTax;
      const nextRevision = (Number(request.quote_revision) || 0) + 1;

      // 2. Update request with quote data
      await trx("bulk_order_request")
        .where({ id })
        .update({
          status: "QUOTED",
          quote_subtotal: calculatedSubtotal,
          quote_shipping: quoteShipping,
          quote_tax: quoteTax,
          quote_total: grandTotal,
          quote_valid_until: new Date(data.quote_valid_until),
          quote_revision: nextRevision,
          quote_notes: data.quote_notes || null,
          admin_notes: data.admin_notes !== undefined ? data.admin_notes : request.admin_notes,
          quoted_at: new Date(),
          updated_at: new Date(),
        });

      // 3. Write audit log
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await trx("bulk_order_audit_log").insert({
        id: logId,
        request_id: id,
        actor_type: "ADMIN",
        actor_id: (req as any).auth_context?.actor_id || "admin",
        action: nextRevision > 1 ? "QUOTATION_REVISED" : "QUOTED",
        previous_status: request.status,
        new_status: "QUOTED",
        message: `Quotation revision #${nextRevision} issued. Subtotal: ₹${calculatedSubtotal}, Tax: ₹${quoteTax}, Shipping: ₹${quoteShipping}, Total: ₹${grandTotal}. Valid until ${new Date(data.quote_valid_until).toLocaleDateString()}`,
        created_at: new Date(),
      });
    });

    const [updatedReq, updatedItems] = await Promise.all([
      db("bulk_order_request").where({ id }).first(),
      db("bulk_order_line_item").where({ request_id: id }),
    ]);

    return res.json({
      ok: true,
      request: { ...updatedReq, items: updatedItems },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: errorMsg });
  }
}
