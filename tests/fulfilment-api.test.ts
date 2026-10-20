import { describe, test, expect, beforeAll } from "vitest";

/**
 * Live integration checks for the packing and shipping workflow.
 * Skipped automatically when the backend is not running.
 */

/** Override with MEDUSA_URL when the backend runs on a non-default port. */
const BASE = process.env.MEDUSA_URL || "http://localhost:9000";

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

let adminToken = "";

function auth() {
  return { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" };
}

async function listOrders(state?: string) {
  const res = await fetch(`${BASE}/admin/fulfilment/orders${state ? `?state=${state}` : ""}`, {
    headers: auth(),
  });
  return res.json();
}

describe.skipIf(!up)("fulfilment queue", () => {
  beforeAll(async () => {
    const res = await fetch(`${BASE}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@skyrostore.com", password: "admin123" }),
    });
    adminToken = (await res.json()).token;
  });

  test("lists orders with a derived state and per-state counts", async () => {
    const body = await listOrders();
    expect(Array.isArray(body.orders)).toBe(true);
    expect(body).toHaveProperty("counts_by_state");
    for (const order of body.orders) {
      expect(order).toHaveProperty("fulfilment_state");
      expect(order).toHaveProperty("item_count");
    }
  });

  test("rejects an unknown state filter", async () => {
    const res = await fetch(`${BASE}/admin/fulfilment/orders?state=nonsense`, { headers: auth() });
    expect(res.status).toBe(400);
  });

  test("exposes the packing list, payment details and history for one order", async () => {
    const { orders } = await listOrders();
    if (!orders.length) return;

    const res = await fetch(`${BASE}/admin/fulfilment/orders/${orders[0].id}`, { headers: auth() });
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.order).toHaveProperty("fulfilment_state");
    expect(Array.isArray(body.packing_list)).toBe(true);
    expect(Array.isArray(body.payment_attempts)).toBe(true);
    expect(Array.isArray(body.history)).toBe(true);
    expect(body.order).toHaveProperty("shipping_address");
  });
});

describe.skipIf(!up)("packing and shipping transitions", () => {
  beforeAll(async () => {
    if (adminToken) return;
    const res = await fetch(`${BASE}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@skyrostore.com", password: "admin123" }),
    });
    adminToken = (await res.json()).token;
  });

  test("refuses to ship without valid tracking details and changes nothing", async () => {
    const { orders } = await listOrders("packed");
    const candidate = orders[0];
    if (!candidate) return;

    for (const body of [{}, { courier: "Delhivery" }, { courier: "Delhivery", tracking_number: "AB" }]) {
      const res = await fetch(`${BASE}/admin/fulfilment/orders/${candidate.id}/ship`, {
        method: "POST",
        headers: auth(),
        body: JSON.stringify(body),
      });
      expect(res.status).toBe(400);
    }

    const after = await fetch(`${BASE}/admin/fulfilment/orders/${candidate.id}`, { headers: auth() });
    expect((await after.json()).order.fulfilment_state).toBe("packed");
  });

  test("refuses to pack an unpaid order", async () => {
    const { orders } = await listOrders("awaiting_payment");
    const candidate = orders.find((o: any) => !o.is_bulk_order);
    if (!candidate) return;

    const res = await fetch(`${BASE}/admin/fulfilment/orders/${candidate.id}/pack`, {
      method: "POST",
      headers: auth(),
      body: "{}",
    });
    expect(res.status).toBe(400);
  });

  test("packing is idempotent", async () => {
    const { orders } = await listOrders("paid_processing");
    const candidate = orders[0];
    if (!candidate) return;

    const first = await fetch(`${BASE}/admin/fulfilment/orders/${candidate.id}/pack`, {
      method: "POST",
      headers: auth(),
      body: "{}",
    });
    const firstBody = await first.json();
    // Fail loudly rather than skipping: a silent return here once hid a real bug.
    expect(first.ok, `pack failed: ${JSON.stringify(firstBody)}`).toBe(true);
    expect(firstBody.fulfilment_state).toBe("packed");

    const second = await fetch(`${BASE}/admin/fulfilment/orders/${candidate.id}/pack`, {
      method: "POST",
      headers: auth(),
      body: "{}",
    });
    const secondBody = await second.json();
    expect(second.ok).toBe(true);
    expect(secondBody.already_packed).toBe(true);

    const detail = await (
      await fetch(`${BASE}/admin/fulfilment/orders/${candidate.id}`, { headers: auth() })
    ).json();
    expect(detail.fulfilments.length).toBe(1);
  });

  test("shipping with valid tracking is idempotent and records the courier", async () => {
    const { orders } = await listOrders("packed");
    const candidate = orders[0];
    if (!candidate) return;

    const payload = JSON.stringify({ courier: "Delhivery", tracking_number: "VITEST1234567" });
    const first = await fetch(`${BASE}/admin/fulfilment/orders/${candidate.id}/ship`, {
      method: "POST",
      headers: auth(),
      body: payload,
    });
    const firstBody = await first.json();
    expect(first.ok, `ship failed: ${JSON.stringify(firstBody)}`).toBe(true);
    expect(firstBody.fulfilment_state).toBe("shipped");
    expect(firstBody.tracking_number).toBe("VITEST1234567");

    const second = await fetch(`${BASE}/admin/fulfilment/orders/${candidate.id}/ship`, {
      method: "POST",
      headers: auth(),
      body: payload,
    });
    const secondBody = await second.json();
    expect(second.ok).toBe(true);
    expect(secondBody.already_shipped).toBe(true);

    const detail = await (
      await fetch(`${BASE}/admin/fulfilment/orders/${candidate.id}`, { headers: auth() })
    ).json();
    const shipped = detail.fulfilments.filter((f: any) => f.shipped_at);
    expect(shipped).toHaveLength(1);
    expect(shipped[0].courier).toBe("Delhivery");
  });

  test("cannot mark delivered before shipping", async () => {
    const { orders } = await listOrders("paid_processing");
    const candidate = orders[0];
    if (!candidate) return;

    const res = await fetch(`${BASE}/admin/fulfilment/orders/${candidate.id}/deliver`, {
      method: "POST",
      headers: auth(),
      body: "{}",
    });
    expect([400, 200]).toContain(res.status);
    if (res.status === 200) {
      expect((await res.json()).already_delivered).toBe(true);
    }
  });
});

describe.skipIf(!up)("bulk order conversion", () => {
  beforeAll(async () => {
    if (adminToken) return;
    const res = await fetch(`${BASE}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@skyrostore.com", password: "admin123" }),
    });
    adminToken = (await res.json()).token;
  });

  test("a converted bulk order appears in the normal fulfilment queue with its items", async () => {
    const listRes = await fetch(`${BASE}/admin/bulk-orders?status=CONVERTED_TO_ORDER`, { headers: auth() });
    if (!listRes.ok) return;
    const { requests } = await listRes.json();
    const converted = (requests || []).find((r: any) => r.linked_order_id?.startsWith("order_"));
    if (!converted) return;

    const detail = await fetch(`${BASE}/admin/fulfilment/orders/${converted.linked_order_id}`, {
      headers: auth(),
    });
    expect(detail.ok).toBe(true);
    const body = await detail.json();
    expect(body.packing_list.length).toBeGreaterThan(0);
    expect(body.bulk_order_request?.reference_no).toBe(converted.reference_no);
  });

  test("conversion requires an accepted, fully priced quotation", async () => {
    const listRes = await fetch(`${BASE}/admin/bulk-orders?status=SUBMITTED`, { headers: auth() });
    if (!listRes.ok) return;
    const { requests } = await listRes.json();
    const submitted = (requests || [])[0];
    if (!submitted) return;

    const res = await fetch(`${BASE}/admin/bulk-orders/${submitted.id}/convert`, {
      method: "POST",
      headers: auth(),
    });
    expect(res.status).toBe(400);
  });
});

describe.skipIf(!up)("end-to-end pack, ship, deliver", () => {
  beforeAll(async () => {
    if (adminToken) return;
    const res = await fetch(`${BASE}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@skyrostore.com", password: "admin123" }),
    });
    adminToken = (await res.json()).token;
  });

  test("one paid order moves through every transition and records courier and tracking", async () => {
    const { orders } = await listOrders("paid_processing");
    const order = orders[0];
    if (!order) return;

    const post = async (action: string, body: Record<string, unknown>) => {
      const res = await fetch(`${BASE}/admin/fulfilment/orders/${order.id}/${action}`, {
        method: "POST",
        headers: auth(),
        body: JSON.stringify(body),
      });
      const parsed = await res.json();
      expect(res.ok, `${action} failed: ${JSON.stringify(parsed)}`).toBe(true);
      return parsed;
    };

    expect((await post("pack", {})).fulfilment_state).toBe("packed");
    expect(
      (await post("ship", { courier: "BlueDart", tracking_number: "E2ETRACK0001" })).fulfilment_state
    ).toBe("shipped");
    expect((await post("deliver", {})).fulfilment_state).toBe("delivered");

    const detail = await (
      await fetch(`${BASE}/admin/fulfilment/orders/${order.id}`, { headers: auth() })
    ).json();
    expect(detail.order.fulfilment_state).toBe("delivered");
    expect(detail.fulfilments).toHaveLength(1);
    expect(detail.fulfilments[0].courier).toBe("BlueDart");
    expect(detail.fulfilments[0].tracking_numbers).toContain("E2ETRACK0001");
    const events = detail.history.map((h: any) => h.event);
    expect(events).toContain("packed");
    expect(events).toContain("shipped");
    expect(events).toContain("delivered");
  });
});

describe.skipIf(!up)("admin authorisation on transitions", () => {
  test("pack, ship and deliver all require an admin token", async () => {
    for (const action of ["pack", "ship", "deliver"]) {
      const res = await fetch(`${BASE}/admin/fulfilment/orders/order_probe/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      expect([401, 403]).toContain(res.status);
    }
  });
});
