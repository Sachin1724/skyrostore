import { describe, test, expect, beforeAll } from "vitest";

const BASE = "http://localhost:9000";
const PK = "pk_11e52cb93d15418c56289d434fee7c53a391460b6a393b72ad48192afe3c4816";

let adminToken = "";
let customerTokenA = "";
let customerTokenB = "";

async function getOrCreateCustomer(email: string, pass: string): Promise<string> {
  const loginRes = await fetch(`${BASE}/auth/customer/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
    body: JSON.stringify({ email, password: pass }),
  });
  if (loginRes.ok) {
    const data = await loginRes.json();
    const parts = data.token.split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    if (payload.actor_id) return data.token;
  }

  const regRes = await fetch(`${BASE}/auth/customer/emailpass/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
    body: JSON.stringify({ email, password: pass }),
  });
  const regData = await regRes.json();

  await fetch(`${BASE}/store/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PK,
      Authorization: `Bearer ${regData.token}`,
    },
    body: JSON.stringify({ email, first_name: "Test", last_name: "Customer" }),
  });

  const freshLogin = await fetch(`${BASE}/auth/customer/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
    body: JSON.stringify({ email, password: pass }),
  });
  const { token } = await freshLogin.json();
  return token;
}

beforeAll(async () => {
  // Admin auth
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@skyrostore.com", password: "admin123" }),
  });
  const data = await res.json();
  adminToken = data.token;

  // Customer A and Customer B
  customerTokenA = await getOrCreateCustomer("customera@skyrostore.test", "Customer123!");
  customerTokenB = await getOrCreateCustomer("customerb@skyrostore.test", "Customer123!");
});

describe("Bulk Order & Custom UAV Requests Workflow", () => {
  let createdRequestIdA = "";
  let referenceNoA = "";

  test("rejects invalid request with missing fields or zero quantity", async () => {
    const res = await fetch(`${BASE}/store/bulk-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
      body: JSON.stringify({
        contact_name: "Test",
        email: "not-an-email",
        request_type: "BULK_PURCHASE",
        items: [{ title: "Motor", requested_quantity: 0 }],
      }),
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  test("rejects excessive quantities exceeding safe limit (> 10000)", async () => {
    const res = await fetch(`${BASE}/store/bulk-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
      body: JSON.stringify({
        contact_name: "Industrial Buyer",
        email: "buyer@enterprise.com",
        request_type: "BULK_PURCHASE",
        items: [{ title: "Propellers", requested_quantity: 999999 }],
      }),
    });
    expect(res.status).toBe(400);
  });

  test("accepts valid bulk custom UAV request from authenticated Customer A", async () => {
    const res = await fetch(`${BASE}/store/bulk-orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PK,
        Authorization: `Bearer ${customerTokenA}`,
      },
      body: JSON.stringify({
        contact_name: "Dr. Vikram Sarabhai",
        email: "customera@skyrostore.test",
        phone: "+91 9876543210",
        company_name: "AeroTech Dynamics Ltd",
        gstin: "27AABCA1234F1Z8",
        request_type: "BULK_CUSTOM_BUILD",
        items: [
          {
            title: "Custom Long-Endurance Hexacopter Airframe",
            requested_quantity: 5,
            notes: "Requires vibration damping for LiDAR payload",
          },
        ],
        intended_application: "Topographical LiDAR Mapping & Inspection",
        target_payload_g: 2500,
        target_flight_time_min: 45,
        operating_environment: "High Altitude & Dusty Terrain (Leh, Ladakh)",
        sensors_payload: "RIEGL miniVUX-1UAV LiDAR + Sony A6000",
        telemetry_requirements: "Dual Redundant 868MHz + 4G LTE",
        target_unit_count: 5,
        delivery_city: "Bengaluru",
        delivery_state: "Karnataka",
        delivery_pincode: "560001",
        timeframe_weeks: 6,
        budget_range: "INR 25,00,000 - 35,00,000",
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.request.id).toBeTruthy();
    expect(data.request.reference_no).toMatch(/^REQ-\d{4}-\d{6}$/);
    expect(data.request.status).toBe("SUBMITTED");

    createdRequestIdA = data.request.id;
    referenceNoA = data.request.reference_no;
  });

  test("unauthenticated access to list customer requests is rejected", async () => {
    const res = await fetch(`${BASE}/store/bulk-orders`, {
      headers: { "x-publishable-api-key": PK },
    });
    expect(res.status).toBe(401);
  });

  test("Customer A can retrieve their own submitted request", async () => {
    const res = await fetch(`${BASE}/store/bulk-orders/${createdRequestIdA}`, {
      headers: {
        "x-publishable-api-key": PK,
        Authorization: `Bearer ${customerTokenA}`,
      },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.request.id).toBe(createdRequestIdA);
    expect(data.request.items.length).toBe(1);
    expect(data.request.items[0].requested_quantity).toBe(5);
    expect(data.request.audit_logs.length).toBeGreaterThan(0);
  });

  test("Customer B CANNOT retrieve Customer A's request (customer isolation enforced)", async () => {
    const res = await fetch(`${BASE}/store/bulk-orders/${createdRequestIdA}`, {
      headers: {
        "x-publishable-api-key": PK,
        Authorization: `Bearer ${customerTokenB}`,
      },
    });
    expect(res.status).toBe(404);
  });

  test("Admin can view the request in the management portal", async () => {
    const res = await fetch(`${BASE}/admin/bulk-orders/${createdRequestIdA}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.request.reference_no).toBe(referenceNoA);
    expect(data.request.status).toBe("SUBMITTED");
  });

  test("invalid status transition is rejected by state machine", async () => {
    // Attempting SUBMITTED -> CONVERTED_TO_ORDER directly is invalid!
    const res = await fetch(`${BASE}/admin/bulk-orders/${createdRequestIdA}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: "CONVERTED_TO_ORDER" }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid status transition");
  });

  test("Admin moves request to UNDER_REVIEW", async () => {
    const res = await fetch(`${BASE}/admin/bulk-orders/${createdRequestIdA}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: "UNDER_REVIEW",
        admin_notes: "Engineering team evaluating high altitude motor thrust envelope.",
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.request.status).toBe("UNDER_REVIEW");
    expect(data.request.admin_notes).toContain("Engineering team");
  });

  test("Admin issues formal quotation with line item prices, tax, shipping, and validity", async () => {
    // Fetch request to get line item ID
    const getRes = await fetch(`${BASE}/admin/bulk-orders/${createdRequestIdA}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getData = await getRes.json();
    const lineItemId = getData.request.items[0].id;

    const validity = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(); // 14 days

    const quoteRes = await fetch(`${BASE}/admin/bulk-orders/${createdRequestIdA}/quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            id: lineItemId,
            quoted_unit_price: 450000, // 4.5 Lakhs per unit
          },
        ],
        quote_shipping: 25000,
        quote_tax: 405000, // 18% GST
        quote_valid_until: validity,
        quote_notes: "Includes carbon fiber airframes, avionics, bench calibration, and test flight reports.",
      }),
    });

    expect(quoteRes.status).toBe(200);
    const data = await quoteRes.json();
    expect(data.request.status).toBe("QUOTED");
    expect(Number(data.request.quote_subtotal)).toBe(2250000); // 5 * 450,000 = 2,250,000
    expect(Number(data.request.quote_shipping)).toBe(25000);
    expect(Number(data.request.quote_tax)).toBe(405000);
    expect(Number(data.request.quote_total)).toBe(2680000); // 2,250,000 + 25,000 + 405,000 = 2,680,000
    expect(data.request.quote_revision).toBe(1);
  });

  test("Admin can revise the quotation with revision increment", async () => {
    const getRes = await fetch(`${BASE}/admin/bulk-orders/${createdRequestIdA}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getData = await getRes.json();
    const lineItemId = getData.request.items[0].id;

    const validity = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();

    const reviseRes = await fetch(`${BASE}/admin/bulk-orders/${createdRequestIdA}/quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            id: lineItemId,
            quoted_unit_price: 430000, // Discounted to 4.3 Lakhs
          },
        ],
        quote_shipping: 20000,
        quote_tax: 387000,
        quote_valid_until: validity,
        quote_notes: "Revised with 5-unit volume discount applied.",
      }),
    });

    expect(reviseRes.status).toBe(200);
    const data = await reviseRes.json();
    expect(data.request.quote_revision).toBe(2);
    expect(Number(data.request.quote_subtotal)).toBe(2150000); // 5 * 430,000
  });

  test("Customer A accepts the issued quotation", async () => {
    const res = await fetch(`${BASE}/store/bulk-orders/${createdRequestIdA}/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PK,
        Authorization: `Bearer ${customerTokenA}`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.status).toBe("ACCEPTED");
  });

  test("Duplicate customer acceptance is idempotent (does not fail or mutate state)", async () => {
    const res = await fetch(`${BASE}/store/bulk-orders/${createdRequestIdA}/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PK,
        Authorization: `Bearer ${customerTokenA}`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.status).toBe("ACCEPTED");
  });

  test("Admin converts accepted quotation into Medusa order workflow", async () => {
    const res = await fetch(`${BASE}/admin/bulk-orders/${createdRequestIdA}/convert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.order_id).toMatch(/^ord_bulk_/);
    expect(data.request.status).toBe("CONVERTED_TO_ORDER");
    expect(data.request.linked_order_id).toBe(data.order_id);
  });

  test("Converting already converted order is idempotent and preserves order ID", async () => {
    const res = await fetch(`${BASE}/admin/bulk-orders/${createdRequestIdA}/convert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.already_converted).toBe(true);
    expect(data.order_id).toBeTruthy();
  });
});
