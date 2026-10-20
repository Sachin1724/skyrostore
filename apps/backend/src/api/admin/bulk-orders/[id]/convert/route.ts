import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createOrderWorkflow } from "@medusajs/medusa/core-flows";

/**
 * Converts an accepted quotation into a real Medusa order, so a bulk order is
 * packed and shipped through exactly the same fulfilment workflow as any other
 * order. The bulk request keeps the order id for traceability.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;
    const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    const actorId = (req as any).auth_context?.actor_id || "admin";

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

    const lineItems = await db("bulk_order_line_item").where({ request_id: id });
    if (!lineItems.length) {
      return res.status(400).json({ error: "Request has no line items to convert." });
    }

    const unpriced = lineItems.filter((item: any) => item.quoted_unit_price === null || item.quoted_unit_price === undefined);
    if (unpriced.length) {
      return res.status(400).json({
        error: "Every line item must carry a quoted unit price before conversion.",
        unpriced_item_ids: unpriced.map((i: any) => i.id),
      });
    }

    const [{ data: regions }, { data: salesChannels }, { data: shippingOptions }] = await Promise.all([
      query.graph({ entity: "region", fields: ["id", "currency_code", "name"], pagination: { take: 1, skip: 0 } }),
      query.graph({ entity: "sales_channel", fields: ["id", "name"], pagination: { take: 1, skip: 0 } }),
      query.graph({ entity: "shipping_option", fields: ["id", "name"], pagination: { take: 1, skip: 0 } }),
    ]);

    const region = (regions as any[])?.[0];
    if (!region) {
      return res.status(400).json({ error: "No region configured; cannot create an order." });
    }
    const shippingOption = (shippingOptions as any[])?.[0];

    const nameParts = String(request.contact_name || "Customer").trim().split(/\s+/);
    const address = {
      first_name: nameParts[0] || "Customer",
      last_name: nameParts.slice(1).join(" ") || "-",
      company: request.company_name || undefined,
      address_1: [request.delivery_city, request.delivery_state].filter(Boolean).join(", ") || "To be confirmed",
      city: request.delivery_city || "To be confirmed",
      province: request.delivery_state || undefined,
      postal_code: request.delivery_pincode || "000000",
      country_code: "in",
      phone: request.phone || undefined,
    };

    const { result: order } = await createOrderWorkflow(req.scope).run({
      input: {
        region_id: region.id,
        currency_code: region.currency_code,
        sales_channel_id: (salesChannels as any[])?.[0]?.id,
        customer_id: request.customer_id || undefined,
        email: request.email,
        status: "pending",
        shipping_address: address,
        billing_address: address,
        items: lineItems.map((item: any) => ({
          title: item.title,
          quantity: Number(item.requested_quantity),
          unit_price: Number(item.quoted_unit_price),
          variant_id: item.variant_id || undefined,
          product_id: item.product_id || undefined,
          metadata: {
            bulk_order_line_item_id: item.id,
            configuration_reference: item.configuration_reference || null,
            notes: item.notes || null,
          },
        })),
        ...(shippingOption
          ? {
              shipping_methods: [
                {
                  name: shippingOption.name || "Bulk delivery",
                  shipping_option_id: shippingOption.id,
                  amount: Number(request.quote_shipping || 0),
                },
              ],
            }
          : {}),
        metadata: {
          bulk_order_request_id: id,
          bulk_order_reference: request.reference_no,
          // Bulk orders are invoiced; fulfilment may start before payment capture.
          payment_terms: "invoice",
          quote_total: Number(request.quote_total || 0),
        },
      },
    });

    const orderId = (order as any).id;

    await db.transaction(async (trx: any) => {
      await trx("bulk_order_request")
        .where({ id })
        .update({
          status: "CONVERTED_TO_ORDER",
          linked_order_id: orderId,
          converted_at: new Date(),
          updated_at: new Date(),
        });

      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await trx("bulk_order_audit_log").insert({
        id: logId,
        request_id: id,
        actor_type: "ADMIN",
        actor_id: actorId,
        action: "CONVERTED_TO_ORDER",
        previous_status: "ACCEPTED",
        new_status: "CONVERTED_TO_ORDER",
        message: `Accepted quotation converted to Medusa order ${orderId}. It now follows the standard pack and ship workflow.`,
        created_at: new Date(),
      });
    });

    const updated = await db("bulk_order_request").where({ id }).first();
    return res.json({
      ok: true,
      order_id: orderId,
      display_id: (order as any).display_id ?? null,
      message: `Bulk request converted to order ${orderId}.`,
      request: updated,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: errorMsg });
  }
}
