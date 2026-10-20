/**
 * First-party event tracking: taxonomy, input sanitising, and the
 * abandoned-cart/checkout classification rules.
 *
 * Analytics is observational. It never decides payment or order state; it only
 * records what the commerce modules already consider true.
 */

export const EVENT_TYPES = [
  "session_started",
  "product_viewed",
  "search_performed",
  "product_added_to_cart",
  "cart_item_quantity_changed",
  "cart_item_removed",
  "checkout_started",
  "checkout_step_completed",
  "checkout_step_failed",
  "payment_attempted",
  "payment_succeeded",
  "payment_failed",
  "order_placed",
  // Server-only operational events.
  "order_packed",
  "order_shipped",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const CHECKOUT_STEPS = ["customer", "shipping", "payment", "verify-payment", "complete"] as const;

/**
 * Events a storefront caller may report. These are journey observations only.
 * Payment outcome (`payment_succeeded` / `payment_failed`) and `order_placed`
 * are deliberately excluded: they are written server-side from verified
 * payment-session state, the signed provider webhook, or the `order.placed`
 * commerce event.
 */
export const CLIENT_EVENT_TYPES: readonly string[] = [
  "session_started",
  "product_viewed",
  "search_performed",
  "product_added_to_cart",
  "cart_item_quantity_changed",
  "cart_item_removed",
  "checkout_started",
  "checkout_step_completed",
  "checkout_step_failed",
  "payment_attempted",
];

/** Columns a caller may set. Anything else in the payload is dropped. */
const TEXT_FIELDS = [
  "session_id",
  "visitor_id",
  "customer_id",
  "cart_id",
  "order_id",
  "product_id",
  "variant_id",
  "line_item_id",
  "search_query",
  "checkout_step",
  "page_path",
  "referrer",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "currency_code",
  "source",
] as const;

const NUMBER_FIELDS = ["quantity", "value"] as const;

/** Keys we refuse to persist anywhere, at any nesting depth. */
const SENSITIVE_KEY = /pass|secret|signature|token|cvv|cvc|card|pan|otp|auth|credential|cookie|key$|_key$/i;

const MAX_TEXT = 512;
const MAX_METADATA_KEYS = 20;

export const MAX_EVENTS_PER_BATCH = 20;

function clampText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_TEXT);
}

function clampNumber(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return n;
}

/** Drops sensitive keys recursively; keeps scalars only. */
export function scrubMetadata(input: unknown, depth = 0): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input) || depth > 2) return null;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (SENSITIVE_KEY.test(key)) continue;
    if (Object.keys(out).length >= MAX_METADATA_KEYS) break;
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
      out[key] = typeof value === "string" ? value.slice(0, MAX_TEXT) : value;
    } else {
      const nested = scrubMetadata(value, depth + 1);
      if (nested) out[key] = nested;
    }
  }
  return Object.keys(out).length ? out : null;
}

export type NormalisedEvent = Record<string, unknown> & {
  event_key: string;
  event_type: string;
  session_id: string;
  occurred_at: Date;
};

/**
 * Turns an untrusted payload into a row, or returns a reason string.
 * `allowedTypes` lets the store route accept a narrower taxonomy than the server.
 */
export function normaliseEvent(
  raw: unknown,
  allowedTypes: readonly string[] = EVENT_TYPES
): { event: NormalisedEvent } | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "Event must be an object" };
  const body = raw as Record<string, unknown>;

  const eventType = clampText(body.event_type);
  if (!eventType || !allowedTypes.includes(eventType)) {
    return { error: `Unsupported event_type: ${String(body.event_type)}` };
  }

  const sessionId = clampText(body.session_id);
  if (!sessionId) return { error: "session_id is required" };

  const eventKey = clampText(body.event_key) || `${sessionId}:${eventType}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  const occurredRaw = clampText(body.occurred_at);
  const occurredAt = occurredRaw && !Number.isNaN(Date.parse(occurredRaw)) ? new Date(occurredRaw) : new Date();
  // Never trust a client clock far from ours.
  const now = Date.now();
  const skew = Math.abs(occurredAt.getTime() - now);
  const safeOccurredAt = skew > 24 * 60 * 60 * 1000 ? new Date(now) : occurredAt;

  const event: NormalisedEvent = {
    event_key: eventKey,
    event_type: eventType,
    session_id: sessionId,
    occurred_at: safeOccurredAt,
  };

  for (const field of TEXT_FIELDS) {
    if (field === "session_id") continue;
    event[field] = clampText(body[field]);
  }
  for (const field of NUMBER_FIELDS) {
    event[field] = clampNumber(body[field]);
  }
  if (event.checkout_step && !(CHECKOUT_STEPS as readonly string[]).includes(event.checkout_step as string)) {
    event.checkout_step = null;
  }
  event.metadata = scrubMetadata(body.metadata);
  event.source = event.source || "web";

  return { event };
}

/** Maps a provider error to a coarse category safe to store and display. */
export function safeErrorCategory(message?: string | null): string {
  if (!message) return "unknown";
  const text = String(message).toLowerCase();
  if (text.includes("cancel") || text.includes("dismiss")) return "customer_cancelled";
  if (text.includes("signature") || text.includes("verification")) return "verification_failed";
  if (text.includes("insufficient")) return "insufficient_funds";
  if (text.includes("declin")) return "declined";
  if (text.includes("timeout") || text.includes("network")) return "network_or_timeout";
  if (text.includes("authent") || text.includes("3ds") || text.includes("otp")) return "authentication_failed";
  if (text.includes("no shipping") || text.includes("address")) return "fulfilment_data_missing";
  return "provider_error";
}

/** Minutes of inactivity before a cart counts as abandoned. */
export const ABANDONED_AFTER_MINUTES = Number(process.env.ANALYTICS_ABANDONED_AFTER_MINUTES || 60);

export type CartActivity = {
  cart_id: string;
  completed_order_id?: string | null;
  last_activity_at?: Date | string | null;
  last_checkout_step?: string | null;
  has_pending_payment?: boolean;
};

export type CartClassification = "converted" | "pending_payment" | "active" | "abandoned_checkout" | "abandoned_cart";

/**
 * A cart is abandoned only when it has recorded activity, no completed order,
 * no payment still in flight, and has been quiet past the threshold.
 */
export function classifyCart(cart: CartActivity, now: Date = new Date(), thresholdMinutes = ABANDONED_AFTER_MINUTES): CartClassification {
  if (cart.completed_order_id) return "converted";
  if (cart.has_pending_payment) return "pending_payment";
  if (!cart.last_activity_at) return "active";
  const last = new Date(cart.last_activity_at).getTime();
  const idleMinutes = (now.getTime() - last) / 60000;
  if (idleMinutes < thresholdMinutes) return "active";
  return cart.last_checkout_step ? "abandoned_checkout" : "abandoned_cart";
}

/**
 * Server-side event writer. Used for events that must come from verified state
 * (payment outcomes, order placement) rather than from the browser.
 * Never throws: analytics must not fail a commerce request.
 */
export async function recordEvent(db: any, payload: Record<string, unknown>): Promise<boolean> {
  const result = normaliseEvent(payload);
  if ("error" in result) return false;
  try {
    await db("analytics_event")
      .insert({
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        ...result.event,
        metadata: result.event.metadata ? JSON.stringify(result.event.metadata) : null,
        source: result.event.source || "server",
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict("event_key")
      .ignore();
    return true;
  } catch (err: unknown) {
    console.error("analytics recordEvent failed:", err instanceof Error ? err.message : err);
    return false;
  }
}
