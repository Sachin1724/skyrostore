import { describe, it, expect, beforeAll } from "vitest";

const BASE = "http://localhost:9000";
const PK = "pk_11e52cb93d15418c56289d434fee7c53a391460b6a393b72ad48192afe3c4816";

const VALID_CONFIG = {
  frame_variant_id: "variant_01M4EDHQRBF82QZVWEW0DKWP5W",
  flight_controller_variant_id: "variant_01M4EDHPEXT681J00349S8JBE7",
  esc_variant_id: "variant_01M4EDHPQ5S1HVJBNS9487N9JJ",
  motor_variant_id: "variant_01M4EDHPY7FPKQB2TCK3SB7WQ5",
  propeller_variant_id: "variant_01M4EDHQ5GYD7A5W62JZXBDGBD",
  battery_variant_id: "variant_01M4EDHQJPC7429683G02XC7QR",
  gps_variant_id: "variant_01M4EDHQC1PDB0QZVEF7KN7XK3",
  name: "Test Config",
};

let customerToken: string;

async function getOrCreateCustomer(email: string, password: string): Promise<string> {
  // Try login first
  const loginRes = await fetch(`${BASE}/auth/customer/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
    body: JSON.stringify({ email, password }),
  });
  if (loginRes.ok) {
    const data = await loginRes.json();
    // Check if actor_id is populated (customer profile exists)
    const parts = data.token.split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    if (payload.actor_id) return data.token;
  }

  // Register: auth identity first, then customer profile
  const regRes = await fetch(`${BASE}/auth/customer/emailpass/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
    body: JSON.stringify({ email, password }),
  });
  const regData = await regRes.json();

  await fetch(`${BASE}/store/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PK,
      Authorization: `Bearer ${regData.token}`,
    },
    body: JSON.stringify({ email, first_name: "Test", last_name: "User" }),
  });

  // Re-login to get token with actor_id populated
  const freshLogin = await fetch(`${BASE}/auth/customer/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
    body: JSON.stringify({ email, password }),
  });
  const { token } = await freshLogin.json();
  return token;
}

async function getCustomerToken(): Promise<string> {
  return getOrCreateCustomer("test@skyrostore.com", "test1234");
}

function headers(token?: string) {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "x-publishable-api-key": PK,
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

beforeAll(async () => {
  customerToken = await getCustomerToken();
});

describe("ownership — unauthenticated access", () => {
  it("rejects unauthenticated save", async () => {
    const res = await fetch(`${BASE}/store/uav/configurations`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(VALID_CONFIG),
    });
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated list", async () => {
    const res = await fetch(`${BASE}/store/uav/configurations`, {
      headers: headers(),
    });
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated retrieve", async () => {
    const res = await fetch(`${BASE}/store/uav/configurations/fake_id`, {
      headers: headers(),
    });
    expect(res.status).toBe(401);
  });

  it("allows unauthenticated validate (stateless)", async () => {
    const res = await fetch(`${BASE}/store/uav/configurations/validate`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(VALID_CONFIG),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(true);
  });
});

describe("ownership — authenticated CRUD", () => {
  let configId: string;

  it("saves configuration with auth", async () => {
    const res = await fetch(`${BASE}/store/uav/configurations`, {
      method: "POST",
      headers: headers(customerToken),
      body: JSON.stringify(VALID_CONFIG),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.configuration_id).toBeDefined();
    configId = data.configuration_id;
  });

  it("lists only own configurations", async () => {
    const res = await fetch(`${BASE}/store/uav/configurations`, {
      headers: headers(customerToken),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.configurations.length).toBeGreaterThan(0);
    expect(data.configurations.every((c: any) => c.customer_id)).toBe(true);
  });

  it("retrieves own configuration", async () => {
    const res = await fetch(`${BASE}/store/uav/configurations/${configId}`, {
      headers: headers(customerToken),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.configuration.id).toBe(configId);
  });
});

describe("ownership — cross-customer access", () => {
  let configId: string;
  let otherToken: string;

  beforeAll(async () => {
    const saveRes = await fetch(`${BASE}/store/uav/configurations`, {
      method: "POST",
      headers: headers(customerToken),
      body: JSON.stringify({ ...VALID_CONFIG, name: "Cross-test Config" }),
    });
    const saveData = await saveRes.json();
    configId = saveData.configuration_id;

    otherToken = await getOrCreateCustomer("other@skyrostore.com", "other1234");
  });

  it("denies cross-customer config access", async () => {
    const res = await fetch(`${BASE}/store/uav/configurations/${configId}`, {
      headers: headers(otherToken),
    });
    expect(res.status).toBe(404);
  });

  it("other customer list does not include first customer configs", async () => {
    const res = await fetch(`${BASE}/store/uav/configurations`, {
      headers: headers(otherToken),
    });
    const data = await res.json();
    const ids = data.configurations.map((c: any) => c.id);
    expect(ids).not.toContain(configId);
  });
});

describe("snapshot — creation and immutability", () => {
  let configId: string;
  let snapshotId: string;

  beforeAll(async () => {
    const saveRes = await fetch(`${BASE}/store/uav/configurations`, {
      method: "POST",
      headers: headers(customerToken),
      body: JSON.stringify({ ...VALID_CONFIG, name: "Snapshot Test Config" }),
    });
    const saveData = await saveRes.json();
    configId = saveData.configuration_id;
  });

  it("creates snapshot with re-validation", async () => {
    const res = await fetch(`${BASE}/store/uav/configurations/${configId}/snapshot`, {
      method: "POST",
      headers: headers(customerToken),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.snapshot_id).toBeDefined();
    expect(data.validation.valid).toBe(true);
    snapshotId = data.snapshot_id;
  });

  it("retrieves snapshot data", async () => {
    const res = await fetch(`${BASE}/store/uav/configurations/${configId}/snapshot`, {
      headers: headers(customerToken),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.snapshots.length).toBeGreaterThan(0);
    const snap = data.snapshots[0];
    expect(snap.snapshot_data).toBeDefined();
    expect(snap.snapshot_data.items).toBeDefined();
    expect(snap.snapshot_data.validation).toBeDefined();
    expect(snap.snapshot_data.captured_at).toBeDefined();
  });

  it("snapshot contains component details", async () => {
    const res = await fetch(`${BASE}/store/uav/configurations/${configId}/snapshot`, {
      headers: headers(customerToken),
    });
    const data = await res.json();
    const snap = data.snapshots[0];
    const items = snap.snapshot_data.items;
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.component_type).toBeDefined();
      expect(item.product_variant_id).toBeDefined();
      expect(item.specs).toBeDefined();
    }
  });

  it("denies snapshot for other customer config", async () => {
    const otherToken = await getOrCreateCustomer("other@skyrostore.com", "other1234");

    const res = await fetch(`${BASE}/store/uav/configurations/${configId}/snapshot`, {
      method: "POST",
      headers: headers(otherToken),
    });
    expect(res.status).toBe(404);
  });
});
