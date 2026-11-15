import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getOrdersListWorkflow } from "@medusajs/medusa/core-flows";
import { deriveFulfilmentState, FULFILMENT_STATES } from "../../../../lib/fulfilment";

const LIST_FIELDS = [
  "id",
  "display_id",
  "status",
  "email",
  "currency_code",
  "total",
  "created_at",
  "updated_at",
  "payment_status",
  "fulfillment_status",
  "metadata",
  "customer.id",
  "customer.first_name",
  "customer.last_name",
  "shipping_address.city",
  "shipping_address.province",
  "shipping_address.phone",
  "items.id",
  "items.title",
  "items.quantity",
  // Search only: matched against, then stripped from the response.
  "fulfillments.metadata",
  "payment_collections.payments.data",
];

/**
 * The order queue for the fulfilment team.
 *
 * ponytail: derived state and free-text search are filtered in memory over the
 * most recent `scan_limit` orders. Push them into SQL if order volume outgrows
 * a few thousand rows.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const paymentStatus = typeof req.query.payment_status === "string" ? req.query.payment_status : "";
  const search = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const scanLimit = Math.min(Number(req.query.scan_limit) || 1000, 5000);

  if (state && !(FULFILMENT_STATES as readonly string[]).includes(state)) {
    return res.status(400).json({ error: `Unknown state: ${state}`, allowed: FULFILMENT_STATES });
  }

  try {
    // Medusa's own list workflow is used because `payment_status` and
    // `fulfillment_status` are computed there; a raw Query graph leaves them unset.
    const { result } = await getOrdersListWorkflow(req.scope).run({
      input: {
        fields: LIST_FIELDS,
        variables: {
          filters: { is_draft_order: false },
          take: scanLimit,
          skip: 0,
          order: { created_at: "DESC" },
        },
      },
    });
    const orders = Array.isArray(result) ? result : (result as any).rows;

    // What staff type to find an order: its AWB, the Razorpay payment id, the customer's phone or name.
    const searchText = (order: any): string =>
      [
        order.email,
        order.display_id,
        order.id,
        order.metadata?.bulk_order_reference,
        order.shipping_address?.phone,
        order.customer?.first_name,
        order.customer?.last_name,
        ...(order.fulfillments ?? []).map((f: any) => f.metadata?.shipmozo_awb),
        ...(order.payment_collections ?? []).flatMap((pc: any) =>
          (pc.payments ?? []).flatMap((p: any) => [p.id, p.data?.razorpay_payment_id, p.data?.razorpay_order_id])
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    const enriched = (orders as any[]).map(({ fulfillments: _f, payment_collections: _p, ...order }) => ({
      ...order,
      _search: searchText({ ...order, fulfillments: _f, payment_collections: _p }),
      fulfilment_state: deriveFulfilmentState(order),
      item_count: (order.items || []).reduce((sum: number, i: any) => sum + Number(i.quantity || 0), 0),
      is_bulk_order: Boolean(order.metadata?.bulk_order_request_id),
    }));

    const filtered = enriched.filter((order) => {
      if (state && order.fulfilment_state !== state) return false;
      if (paymentStatus && order.payment_status !== paymentStatus) return false;
      if (search) {
        // Phone numbers are typed with spaces, dashes or +91; compare digits too.
        const digits = search.replace(/\D/g, "");
        const phoneHit = digits.length >= 6 && String(order.shipping_address?.phone ?? "").replace(/\D/g, "").includes(digits);
        if (!order._search.includes(search) && !phoneHit) return false;
      }
      return true;
    });

    const counts = enriched.reduce((acc: Record<string, number>, order) => {
      acc[order.fulfilment_state] = (acc[order.fulfilment_state] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      orders: filtered.slice(offset, offset + limit).map(({ _search, ...order }) => order),
      count: filtered.length,
      limit,
      offset,
      counts_by_state: counts,
      scanned: enriched.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
}
