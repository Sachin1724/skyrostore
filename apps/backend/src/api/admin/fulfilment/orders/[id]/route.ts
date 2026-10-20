import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { getOrderDetailWorkflow } from "@medusajs/medusa/core-flows";
import { buildPackingList, deriveFulfilmentState } from "../../../../../lib/fulfilment";

const DETAIL_FIELDS = [
  "id",
  "display_id",
  "status",
  "email",
  "currency_code",
  "subtotal",
  "shipping_total",
  "tax_total",
  "total",
  "created_at",
  "updated_at",
  "payment_status",
  "fulfillment_status",
  "metadata",
  "customer.id",
  "customer.email",
  "customer.first_name",
  "customer.last_name",
  "customer.phone",
  "shipping_address.*",
  "billing_address.*",
  "items.id",
  "items.title",
  "items.variant_title",
  "items.variant_sku",
  "items.quantity",
  "items.unit_price",
  "items.total",
  "items.thumbnail",
  "items.metadata",
  "items.detail.quantity",
  "items.detail.fulfilled_quantity",
  "items.detail.shipped_quantity",
  "shipping_methods.id",
  "shipping_methods.name",
  "shipping_methods.amount",
  "payment_collections.id",
  "payment_collections.status",
  "payment_collections.amount",
  "payment_collections.payments.id",
  "payment_collections.payments.provider_id",
  "payment_collections.payments.amount",
  "payment_collections.payments.currency_code",
  "payment_collections.payments.captured_at",
  "payment_collections.payments.canceled_at",
  "fulfillments.id",
  "fulfillments.packed_at",
  "fulfillments.shipped_at",
  "fulfillments.delivered_at",
  "fulfillments.canceled_at",
  "fulfillments.metadata",
  "fulfillments.labels.*",
  "fulfillments.items.*",
];

/** Everything the packing team and support need about one order. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

  try {
    // Same reason as the list route: the workflow computes the payment and
    // fulfilment statuses the operational state is derived from.
    let order: any;
    try {
      const { result } = await getOrderDetailWorkflow(req.scope).run({
        input: { order_id: id, fields: DETAIL_FIELDS },
      });
      order = result;
    } catch {
      order = null;
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const [paymentAttempts, events, bulkRequest] = await Promise.all([
      db("payment_attempt")
        .where({ order_id: id })
        .orWhereIn(
          "cart_id",
          db("cart_payment_collection")
            .select("cart_id")
            .whereIn("payment_collection_id", (order.payment_collections || []).map((pc: any) => pc.id))
        )
        .orderBy("attempted_at", "desc")
        .catch(() => []),
      db("analytics_event").where({ order_id: id }).orderBy("occurred_at", "asc").catch(() => []),
      order.metadata?.bulk_order_request_id
        ? db("bulk_order_request").where({ id: order.metadata.bulk_order_request_id }).first().catch(() => null)
        : Promise.resolve(null),
    ]);

    const fulfilments = (order.fulfillments || []).map((f: any) => ({
      id: f.id,
      packed_at: f.packed_at,
      shipped_at: f.shipped_at,
      delivered_at: f.delivered_at,
      canceled_at: f.canceled_at,
      courier: f.metadata?.courier ?? null,
      tracking_numbers: (f.labels || []).map((l: any) => l.tracking_number).filter(Boolean),
      tracking_urls: (f.labels || []).map((l: any) => l.tracking_url).filter(Boolean),
    }));

    // Status history, oldest first: order events plus fulfilment transitions.
    const history = [
      { at: order.created_at, event: "order_placed", detail: `Order ${order.display_id ?? order.id} placed` },
      ...fulfilments.flatMap((f: any) =>
        [
          f.packed_at && { at: f.packed_at, event: "packed", detail: `Fulfilment ${f.id} packed` },
          f.shipped_at && {
            at: f.shipped_at,
            event: "shipped",
            detail: `Shipped via ${f.courier || "courier"}${f.tracking_numbers[0] ? ` (${f.tracking_numbers[0]})` : ""}`,
          },
          f.delivered_at && { at: f.delivered_at, event: "delivered", detail: `Fulfilment ${f.id} delivered` },
          f.canceled_at && { at: f.canceled_at, event: "fulfilment_cancelled", detail: `Fulfilment ${f.id} cancelled` },
        ].filter(Boolean)
      ),
      ...(paymentAttempts as any[]).map((a) => ({
        at: a.attempted_at,
        event: `payment_${a.status}`,
        detail: `${a.provider_id}${a.error_category ? ` — ${a.error_category}` : ""}${a.is_retry ? " (retry)" : ""}`,
      })),
      ...(events as any[]).map((e) => ({ at: e.occurred_at, event: e.event_type, detail: e.checkout_step || e.page_path || null })),
    ]
      .filter((entry: any) => entry?.at)
      .sort((a: any, b: any) => new Date(a.at).getTime() - new Date(b.at).getTime());

    return res.json({
      order: {
        ...order,
        fulfilment_state: deriveFulfilmentState(order),
      },
      packing_list: buildPackingList(order.items),
      fulfilments,
      payment_attempts: paymentAttempts,
      bulk_order_request: bulkRequest || null,
      history,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
}
