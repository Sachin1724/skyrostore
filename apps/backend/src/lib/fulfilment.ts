/**
 * The operational status model for order fulfilment.
 *
 * There is no separate status table: every state below is derived from the
 * Medusa order's own `status`, `payment_status` and `fulfillment_status`, so
 * there is exactly one source of truth.
 */

export const FULFILMENT_STATES = [
  "awaiting_payment",
  "payment_failed",
  "paid_processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type FulfilmentState = (typeof FULFILMENT_STATES)[number];

const AWAITING_PAYMENT = ["not_paid", "awaiting", "requires_action"];
const FAILED_PAYMENT = ["canceled", "cancelled"];
// Explicit sets, not substring tests: "not_fulfilled" contains "fulfilled".
const DELIVERED = ["delivered", "partially_delivered"];
const SHIPPED = ["shipped", "partially_shipped"];
const PACKED = ["fulfilled", "partially_fulfilled"];

export function deriveFulfilmentState(order: {
  status?: string | null;
  payment_status?: string | null;
  fulfillment_status?: string | null;
}): FulfilmentState {
  const orderStatus = order.status || "";
  const payment = order.payment_status || "";
  const fulfilment = order.fulfillment_status || "";

  if (orderStatus === "canceled" || orderStatus === "cancelled") return "cancelled";
  if (DELIVERED.includes(fulfilment)) return "delivered";
  if (SHIPPED.includes(fulfilment)) return "shipped";
  if (PACKED.includes(fulfilment)) return "packed";
  if (FAILED_PAYMENT.includes(payment)) return "payment_failed";
  if (AWAITING_PAYMENT.includes(payment)) return "awaiting_payment";
  return "paid_processing";
}

/** States from which packing is allowed. */
export function canPack(state: FulfilmentState): boolean {
  return state === "paid_processing";
}

/** States from which shipping is allowed. */
export function canShip(state: FulfilmentState): boolean {
  return state === "packed";
}

export type TrackingInput = {
  courier?: unknown;
  tracking_number?: unknown;
  tracking_url?: unknown;
};

export type TrackingDetails = {
  courier: string;
  tracking_number: string;
  tracking_url?: string;
};

/**
 * Shipping details must be valid before the order can move to shipped —
 * opening or partially filling the tracking form must not ship anything.
 */
export function validateTracking(input: TrackingInput): { details: TrackingDetails } | { error: string } {
  const courier = typeof input.courier === "string" ? input.courier.trim() : "";
  const trackingNumber = typeof input.tracking_number === "string" ? input.tracking_number.trim() : "";
  const trackingUrl = typeof input.tracking_url === "string" ? input.tracking_url.trim() : "";

  if (!courier) return { error: "courier is required" };
  if (courier.length > 120) return { error: "courier must be 120 characters or fewer" };
  if (!trackingNumber) return { error: "tracking_number is required" };
  if (!/^[A-Za-z0-9][A-Za-z0-9 _-]{3,63}$/.test(trackingNumber)) {
    return { error: "tracking_number must be 4-64 alphanumeric characters" };
  }
  if (trackingUrl && !/^https?:\/\//i.test(trackingUrl)) {
    return { error: "tracking_url must be an http(s) URL" };
  }

  return {
    details: {
      courier,
      tracking_number: trackingNumber,
      ...(trackingUrl ? { tracking_url: trackingUrl } : {}),
    },
  };
}

/**
 * Items the packing team must physically pick. A bundle line item carries its
 * contents in metadata; those are expanded for the packing list but the parent
 * line item remains the thing being fulfilled.
 */
export function buildPackingList(items: any[] = []): Array<Record<string, unknown>> {
  return items.map((item) => {
    const metadata = item.metadata || {};
    const rawContents =
      metadata.bundle_contents || metadata.bundle_items || metadata.components || null;
    const contents = Array.isArray(rawContents)
      ? rawContents.map((entry: any) => ({
          title: entry.title || entry.name || entry.component_type || "Component",
          sku: entry.sku || entry.variant_sku || null,
          quantity: Number(entry.quantity ?? 1) * Number(item.quantity ?? item.detail?.quantity ?? 1),
        }))
      : [];

    return {
      line_item_id: item.id,
      title: item.title,
      variant_title: item.variant_title ?? null,
      sku: item.variant_sku ?? item.variant?.sku ?? null,
      quantity: Number(item.quantity ?? item.detail?.quantity ?? 0),
      fulfilled_quantity: Number(item.detail?.fulfilled_quantity ?? 0),
      shipped_quantity: Number(item.detail?.shipped_quantity ?? 0),
      is_bundle: contents.length > 0,
      bundle_contents: contents,
    };
  });
}
