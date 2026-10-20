import { describe, it, expect } from "vitest";
import {
  CLIENT_EVENT_TYPES,
  EVENT_TYPES,
  classifyCart,
  normaliseEvent,
  safeErrorCategory,
  scrubMetadata,
} from "../apps/backend/src/lib/analytics";

describe("event normalisation", () => {
  it("accepts a journey event and keeps only known fields", () => {
    const result = normaliseEvent({
      event_type: "product_viewed",
      event_key: "evk_1",
      session_id: "ses_1",
      visitor_id: "vis_1",
      product_id: "prod_1",
      quantity: "2",
      utm_source: "newsletter",
      bogus_column: "drop me",
    });
    expect("event" in result).toBe(true);
    if (!("event" in result)) return;
    expect(result.event.event_type).toBe("product_viewed");
    expect(result.event.quantity).toBe(2);
    expect(result.event.utm_source).toBe("newsletter");
    expect(result.event).not.toHaveProperty("bogus_column");
  });

  it("requires a session id and a known event type", () => {
    expect(normaliseEvent({ event_type: "product_viewed" })).toEqual({ error: "session_id is required" });
    expect(normaliseEvent({ event_type: "made_up", session_id: "ses_1" })).toHaveProperty("error");
  });

  it("never lets a storefront caller claim a payment outcome or an order", () => {
    for (const forbidden of ["payment_succeeded", "payment_failed", "order_placed", "order_packed", "order_shipped"]) {
      expect(EVENT_TYPES).toContain(forbidden);
      expect(CLIENT_EVENT_TYPES).not.toContain(forbidden);
      expect(normaliseEvent({ event_type: forbidden, session_id: "ses_1" }, CLIENT_EVENT_TYPES)).toHaveProperty(
        "error"
      );
    }
  });

  it("derives a stable idempotency key when one is supplied, and a unique one otherwise", () => {
    const a = normaliseEvent({ event_type: "session_started", session_id: "ses_1", event_key: "evk_fixed" });
    const b = normaliseEvent({ event_type: "session_started", session_id: "ses_1", event_key: "evk_fixed" });
    if (!("event" in a) || !("event" in b)) throw new Error("expected valid events");
    expect(a.event.event_key).toBe(b.event.event_key);

    const c = normaliseEvent({ event_type: "session_started", session_id: "ses_1" });
    const d = normaliseEvent({ event_type: "session_started", session_id: "ses_1" });
    if (!("event" in c) || !("event" in d)) throw new Error("expected valid events");
    expect(c.event.event_key).not.toBe(d.event.event_key);
  });

  it("ignores a wildly wrong client clock", () => {
    const result = normaliseEvent({
      event_type: "session_started",
      session_id: "ses_1",
      occurred_at: "1999-01-01T00:00:00.000Z",
    });
    if (!("event" in result)) throw new Error("expected a valid event");
    expect(result.event.occurred_at.getFullYear()).toBeGreaterThan(2020);
  });

  it("drops an unknown checkout step", () => {
    const result = normaliseEvent({
      event_type: "checkout_step_completed",
      session_id: "ses_1",
      checkout_step: "secret_step",
    });
    if (!("event" in result)) throw new Error("expected a valid event");
    expect(result.event.checkout_step).toBeNull();
  });
});

describe("sensitive data", () => {
  it("strips anything that looks like a secret, token, card or signature", () => {
    const scrubbed = scrubMetadata({
      razorpay_signature: "abc",
      card_number: "4111111111111111",
      cvv: "123",
      auth_token: "jwt",
      api_key: "sk_live_x",
      password: "hunter2",
      provider_reference: "order_x",
      nested: { secret_value: "no", retry_count: 2 },
    });
    expect(scrubbed).toEqual({ provider_reference: "order_x", nested: { retry_count: 2 } });
  });

  it("keeps sensitive keys out of a normalised event's metadata", () => {
    const result = normaliseEvent({
      event_type: "payment_attempted",
      session_id: "ses_1",
      metadata: { razorpay_signature: "abc", provider_id: "pp_razorpay" },
    });
    if (!("event" in result)) throw new Error("expected a valid event");
    expect(JSON.stringify(result.event.metadata)).not.toContain("abc");
    expect(result.event.metadata).toEqual({ provider_id: "pp_razorpay" });
  });
});

describe("payment failure categories", () => {
  it("maps provider messages to coarse, safe categories", () => {
    expect(safeErrorCategory("Payment cancelled by user")).toBe("customer_cancelled");
    expect(safeErrorCategory("Signature verification failed")).toBe("verification_failed");
    expect(safeErrorCategory("Insufficient funds")).toBe("insufficient_funds");
    expect(safeErrorCategory("Card declined by issuer")).toBe("declined");
    expect(safeErrorCategory("network timeout")).toBe("network_or_timeout");
    expect(safeErrorCategory(null)).toBe("unknown");
  });

  it("does not leak the raw provider message", () => {
    expect(safeErrorCategory("card 4111111111111111 declined")).toBe("declined");
  });
});

describe("abandoned cart classification", () => {
  const now = new Date("2026-10-19T12:00:00.000Z");
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60000);

  it("never calls a converted cart abandoned", () => {
    expect(
      classifyCart(
        { cart_id: "cart_1", completed_order_id: "order_1", last_activity_at: minutesAgo(600) },
        now,
        60
      )
    ).toBe("converted");
  });

  it("does not label a cart abandoned right after the customer leaves", () => {
    expect(classifyCart({ cart_id: "cart_1", last_activity_at: minutesAgo(2) }, now, 60)).toBe("active");
  });

  it("waits for the configured threshold", () => {
    expect(classifyCart({ cart_id: "cart_1", last_activity_at: minutesAgo(59) }, now, 60)).toBe("active");
    expect(classifyCart({ cart_id: "cart_1", last_activity_at: minutesAgo(61) }, now, 60)).toBe("abandoned_cart");
  });

  it("separates an abandoned checkout from an abandoned cart", () => {
    expect(
      classifyCart({ cart_id: "cart_1", last_activity_at: minutesAgo(120), last_checkout_step: "payment" }, now, 60)
    ).toBe("abandoned_checkout");
  });

  it("holds a cart with a payment still in flight out of the abandoned set", () => {
    expect(
      classifyCart(
        {
          cart_id: "cart_1",
          last_activity_at: minutesAgo(600),
          last_checkout_step: "payment",
          has_pending_payment: true,
        },
        now,
        60
      )
    ).toBe("pending_payment");
  });

  it("honours a custom threshold", () => {
    expect(classifyCart({ cart_id: "cart_1", last_activity_at: minutesAgo(20) }, now, 15)).toBe("abandoned_cart");
  });
});
