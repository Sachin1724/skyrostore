import { describe, test, expect, beforeAll } from "vitest";

/**
 * Live integration checks for event collection and the admin analytics views.
 * Skipped automatically when the backend is not running.
 */

/** Override with MEDUSA_URL when the backend runs on a non-default port. */
const BASE = process.env.MEDUSA_URL || "http://localhost:9000";
const PK = "pk_11e52cb93d15418c56289d434fee7c53a391460b6a393b72ad48192afe3c4816";

/** Any HTTP answer means the server is listening; the status itself is irrelevant. */
async function backendUp(): Promise<boolean> {
  try {
    await fetch(`${BASE}/store/health`, { signal: AbortSignal.timeout(2500) });
    return true;
  } catch {
    return false;
  }
}

const up = await backendUp();
const storeHeaders = { "Content-Type": "application/json", "x-publishable-api-key": PK };

let adminToken = "";

describe.skipIf(!up)("event collection", () => {
  beforeAll(async () => {
    const res = await fetch(`${BASE}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@skyrostore.com", password: "admin123" }),
    });
    adminToken = (await res.json()).token;
  });

  test("records a journey event", async () => {
    const sessionId = `ses_test_${Date.now()}`;
    const res = await fetch(`${BASE}/store/analytics/events`, {
      method: "POST",
      headers: storeHeaders,
      body: JSON.stringify({
        event_type: "product_viewed",
        event_key: `evk_${sessionId}_1`,
        session_id: sessionId,
        product_id: "prod_test",
        utm_source: "vitest",
      }),
    });
    expect(res.status).toBe(202);
    expect((await res.json()).accepted).toBe(1);

    const listRes = await fetch(`${BASE}/admin/analytics/events?session_id=${sessionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const { events } = await listRes.json();
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe("product_viewed");
    expect(events[0].utm_source).toBe("vitest");
  });

  test("handles duplicate events idempotently", async () => {
    const sessionId = `ses_dup_${Date.now()}`;
    const body = JSON.stringify({
      event_type: "product_added_to_cart",
      event_key: `evk_dup_${sessionId}`,
      session_id: sessionId,
      quantity: 1,
    });

    await fetch(`${BASE}/store/analytics/events`, { method: "POST", headers: storeHeaders, body });
    await fetch(`${BASE}/store/analytics/events`, { method: "POST", headers: storeHeaders, body });

    const listRes = await fetch(`${BASE}/admin/analytics/events?session_id=${sessionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const { count } = await listRes.json();
    expect(count).toBe(1);
  });

  test("refuses a payment outcome or order claimed by the storefront", async () => {
    for (const eventType of ["payment_succeeded", "payment_failed", "order_placed"]) {
      const res = await fetch(`${BASE}/store/analytics/events`, {
        method: "POST",
        headers: storeHeaders,
        body: JSON.stringify({
          event_type: eventType,
          session_id: `ses_forged_${Date.now()}`,
          order_id: "order_forged",
        }),
      });
      expect(res.status).toBe(400);
    }
  });

  test("does not persist secrets or card data from event metadata", async () => {
    const sessionId = `ses_secret_${Date.now()}`;
    await fetch(`${BASE}/store/analytics/events`, {
      method: "POST",
      headers: storeHeaders,
      body: JSON.stringify({
        event_type: "payment_attempted",
        event_key: `evk_secret_${sessionId}`,
        session_id: sessionId,
        metadata: {
          card_number: "4111111111111111",
          razorpay_signature: "deadbeef",
          auth_token: "jwt.value.here",
          provider_id: "pp_razorpay",
        },
      }),
    });

    const listRes = await fetch(`${BASE}/admin/analytics/events?session_id=${sessionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const raw = JSON.stringify(await listRes.json());
    expect(raw).not.toContain("4111111111111111");
    expect(raw).not.toContain("deadbeef");
    expect(raw).not.toContain("jwt.value.here");
    expect(raw).toContain("pp_razorpay");
  });

  test("rejects an oversized batch", async () => {
    const events = Array.from({ length: 25 }, (_, i) => ({
      event_type: "product_viewed",
      session_id: "ses_batch",
      event_key: `evk_batch_${i}`,
    }));
    const res = await fetch(`${BASE}/store/analytics/events`, {
      method: "POST",
      headers: storeHeaders,
      body: JSON.stringify({ events }),
    });
    expect(res.status).toBe(400);
  });
});

describe.skipIf(!up)("payment attempt recording", () => {
  test("cannot be marked succeeded without a verified payment session", async () => {
    const cartId = `cart_fake_${Date.now()}`;
    const res = await fetch(`${BASE}/store/analytics/payment-attempts`, {
      method: "POST",
      headers: storeHeaders,
      body: JSON.stringify({
        cart_id: cartId,
        provider_id: "pp_razorpay",
        provider_reference: "order_fake",
        outcome: "succeeded",
      }),
    });
    expect(res.status).toBe(202);
    const data = await res.json();
    expect(data.status).not.toBe("succeeded");
  });

  test("records a failure with a safe category only", async () => {
    const cartId = `cart_fail_${Date.now()}`;
    await fetch(`${BASE}/store/analytics/payment-attempts`, {
      method: "POST",
      headers: storeHeaders,
      body: JSON.stringify({
        cart_id: cartId,
        provider_id: "pp_razorpay",
        outcome: "failed",
        error_message: "Card 4111111111111111 declined by issuer",
      }),
    });

    const res = await fetch(`${BASE}/admin/analytics/payment-attempts?cart_id=${cartId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(body.attempts[0].status).toBe("failed");
    expect(body.attempts[0].error_category).toBe("declined");
    expect(JSON.stringify(body)).not.toContain("4111111111111111");
  });

  test("counts a repeated attempt on the same cart as a retry", async () => {
    const cartId = `cart_retry_${Date.now()}`;
    const post = (reference: string) =>
      fetch(`${BASE}/store/analytics/payment-attempts`, {
        method: "POST",
        headers: storeHeaders,
        body: JSON.stringify({
          cart_id: cartId,
          provider_id: "pp_razorpay",
          provider_reference: reference,
          outcome: "failed",
          error_message: "declined",
        }),
      });

    await post("order_try_1");
    await post("order_try_2");

    const res = await fetch(`${BASE}/admin/analytics/payment-attempts?cart_id=${cartId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const { attempts } = await res.json();
    expect(attempts).toHaveLength(2);
    expect(attempts.some((a: any) => a.is_retry)).toBe(true);
  });
});

describe.skipIf(!up)("admin authorisation", () => {
  const protectedPaths = [
    "/admin/analytics/overview",
    "/admin/analytics/events",
    "/admin/analytics/abandoned-carts",
    "/admin/analytics/payment-attempts",
    "/admin/fulfilment/orders",
  ];

  test("every admin analytics and fulfilment view requires authentication", async () => {
    for (const path of protectedPaths) {
      const res = await fetch(`${BASE}${path}`);
      expect([401, 403]).toContain(res.status);
    }
  });

  test("a customer token cannot read admin analytics", async () => {
    const reg = await fetch(`${BASE}/auth/customer/emailpass/register`, {
      method: "POST",
      headers: storeHeaders,
      body: JSON.stringify({ email: `analytics_probe_${Date.now()}@skyrostore.test`, password: "Customer123!" }),
    });
    const { token } = await reg.json().catch(() => ({ token: "" }));
    if (!token) return;

    const res = await fetch(`${BASE}/admin/analytics/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([401, 403]).toContain(res.status);
  });
});

describe.skipIf(!up)("dashboard metrics", () => {
  test("reports real counts and says when collection has not started", async () => {
    const res = await fetch(`${BASE}/admin/analytics/overview?days=30`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.event_collection).toHaveProperty("active");
    if (!body.event_collection.active) {
      expect(body.event_collection.note).toBeTruthy();
      expect(body.journey.product_views).toBe(0);
    }
    for (const value of Object.values(body.fulfilment as Record<string, number>)) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });

  test("abandoned carts are classified, never guessed at", async () => {
    const res = await fetch(`${BASE}/admin/analytics/abandoned-carts?threshold_minutes=60`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(body.threshold_minutes).toBe(60);
    for (const cart of body.carts) {
      expect(["abandoned_cart", "abandoned_checkout"]).toContain(cart.state);
      expect(cart.idle_minutes).toBeGreaterThanOrEqual(60);
      expect(cart).not.toHaveProperty("abandon_reason");
    }
  });
});
