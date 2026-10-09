import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { z } from "zod";
import { generateReferenceNo } from "../../../lib/bulk-orders";

const itemSchema = z.object({
  title: z.string().min(1, "Product or component title is required"),
  requested_quantity: z.number().int().min(1, "Quantity must be at least 1").max(10000, "Maximum quantity is 10,000"),
  product_id: z.string().optional().nullable(),
  variant_id: z.string().optional().nullable(),
  configuration_reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const createBulkOrderSchema = z.object({
  contact_name: z.string().min(2, "Contact name is required"),
  email: z.string().email("Valid email address is required"),
  phone: z.string().optional().nullable(),
  company_name: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  request_type: z.enum(["BULK_PURCHASE", "CUSTOM_BUILD", "BULK_CUSTOM_BUILD"]),
  items: z.array(itemSchema).min(1, "At least one item or build specification is required"),
  // Custom Engineering Requirements
  intended_application: z.string().optional().nullable(),
  target_payload_g: z.number().positive().optional().nullable(),
  target_flight_time_min: z.number().positive().optional().nullable(),
  operating_environment: z.string().optional().nullable(),
  sensors_payload: z.string().optional().nullable(),
  telemetry_requirements: z.string().optional().nullable(),
  target_unit_count: z.number().int().positive().default(1),
  additional_specifications: z.string().optional().nullable(),
  // Delivery & Commercial Details
  delivery_city: z.string().optional().nullable(),
  delivery_state: z.string().optional().nullable(),
  delivery_pincode: z.string().optional().nullable(),
  timeframe_weeks: z.number().int().positive().optional().nullable(),
  budget_range: z.string().optional().nullable(),
});

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parseResult = createBulkOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parseResult.error.flatten(),
      });
    }

    const data = parseResult.data;
    // Security: NEVER trust client-submitted customer ID, take strictly from verified auth context
    const verifiedCustomerId = (req as any).auth_context?.actor_id || null;

    const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const referenceNo = generateReferenceNo();

    await db.transaction(async (trx: any) => {
      // 1. Insert Request
      await trx("bulk_order_request").insert({
        id: requestId,
        reference_no: referenceNo,
        customer_id: verifiedCustomerId,
        contact_name: data.contact_name,
        email: data.email,
        phone: data.phone || null,
        company_name: data.company_name || null,
        gstin: data.gstin || null,
        request_type: data.request_type,
        status: "SUBMITTED",
        intended_application: data.intended_application || null,
        target_payload_g: data.target_payload_g || null,
        target_flight_time_min: data.target_flight_time_min || null,
        operating_environment: data.operating_environment || null,
        sensors_payload: data.sensors_payload || null,
        telemetry_requirements: data.telemetry_requirements || null,
        target_unit_count: data.target_unit_count || 1,
        additional_specifications: data.additional_specifications || null,
        delivery_city: data.delivery_city || null,
        delivery_state: data.delivery_state || null,
        delivery_pincode: data.delivery_pincode || null,
        timeframe_weeks: data.timeframe_weeks || null,
        budget_range: data.budget_range || null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // 2. Insert Line Items
      for (const item of data.items) {
        const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await trx("bulk_order_line_item").insert({
          id: itemId,
          request_id: requestId,
          product_id: item.product_id || null,
          variant_id: item.variant_id || null,
          title: item.title,
          configuration_reference: item.configuration_reference || null,
          requested_quantity: item.requested_quantity,
          notes: item.notes || null,
          created_at: new Date(),
        });
      }

      // 3. Write Audit Log
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await trx("bulk_order_audit_log").insert({
        id: logId,
        request_id: requestId,
        actor_type: verifiedCustomerId ? "CUSTOMER" : "SYSTEM",
        actor_id: verifiedCustomerId,
        action: "SUBMITTED",
        previous_status: null,
        new_status: "SUBMITTED",
        message: `Bulk request submitted for ${data.items.length} line item(s). Reference: ${referenceNo}`,
        created_at: new Date(),
      });
    });

    return res.status(201).json({
      ok: true,
      request: {
        id: requestId,
        reference_no: referenceNo,
        status: "SUBMITTED",
        message: "Your bulk / custom UAV build request has been received.",
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Bulk order submission error:", err);
    return res.status(500).json({ error: errorMsg });
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id;
    if (!customerId) {
      return res.status(401).json({ error: "Authentication required to view requests" });
    }

    const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

    const requests = await db("bulk_order_request")
      .where({ customer_id: customerId })
      .orderBy("created_at", "desc");

    // Fetch line items for each request
    const requestIds = requests.map((r: any) => r.id);
    const lineItems = requestIds.length > 0
      ? await db("bulk_order_line_item").whereIn("request_id", requestIds)
      : [];

    const itemsByReq = lineItems.reduce((acc: Record<string, any[]>, item: any) => {
      if (!acc[item.request_id]) acc[item.request_id] = [];
      acc[item.request_id].push(item);
      return acc;
    }, {});

    const enriched = requests.map((r: any) => ({
      ...r,
      items: itemsByReq[r.id] || [],
    }));

    return res.json({ requests: enriched, count: enriched.length });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: errorMsg });
  }
}
