import { describe, it, expect, beforeAll } from "vitest";

const BASE = process.env.MEDUSA_URL || "http://localhost:9000";
const PK = "pk_11e52cb93d15418c56289d434fee7c53a391460b6a393b72ad48192afe3c4816";

let adminToken: string;

async function getAdminToken(): Promise<string> {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@skyrostore.com", password: "admin123" }),
  });
  const data = await res.json();
  return data.token;
}

describe("Order-Snapshot Linkage", () => {
  beforeAll(async () => {
    adminToken = await getAdminToken();
  }, 15000);

  describe("POST /store/uav/order-snapshot", () => {
    const TEST_VARIANT_IDS = [
      "variant_01M4EDHQRBF82QZVWEW0DKWP5W", // Frame
      "variant_01M4EDHPEXT681J00349S8JBE7", // FC
      "variant_01M4EDHPQ5S1HVJBNS9487N9JJ", // ESC
      "variant_01M4EDHPY7FPKQB2TCK3SB7WQ5", // Motor
      "variant_01M4EDHQ5GYD7A5W62JZXBDGBD", // Propeller
      "variant_01M4EDHQC1PDB0QZVEF7KN7XK3", // GPS
      "variant_01M4EDHQJPC7429683G02XC7QR", // Battery
    ];

    const fakeOrderId = `order_test_${Date.now()}`;
    let snapshotId: string;

    it("creates snapshot linked to order", async () => {
      const items = TEST_VARIANT_IDS.map((v) => ({ variant_id: v, quantity: 1 }));
      const res = await fetch(`${BASE}/store/uav/order-snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
        body: JSON.stringify({ order_id: fakeOrderId, items }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.snapshot_ids).toBeDefined();
      expect(data.snapshot_ids.length).toBeGreaterThan(0);
      snapshotId = data.snapshot_ids[0];
    });

    it("is idempotent — second call returns same snapshot", async () => {
      const items = TEST_VARIANT_IDS.map((v) => ({ variant_id: v, quantity: 1 }));
      const res = await fetch(`${BASE}/store/uav/order-snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
        body: JSON.stringify({ order_id: fakeOrderId, items }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.already_exists).toBe(true);
      expect(data.snapshot_ids[0]).toBe(snapshotId);
    });

    it("admin retrieves snapshot by order_id", async () => {
      const res = await fetch(`${BASE}/admin/uav/configurations?order_id=${fakeOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.snapshots).toBeDefined();
      expect(data.snapshots.length).toBeGreaterThan(0);
      const snap = data.snapshots[0];
      expect(snap.order_id).toBe(fakeOrderId);
      expect(snap.snapshot_data.items).toBeDefined();
      expect(snap.snapshot_data.items.length).toBeGreaterThan(0);
    });

    it("snapshot contains component details", async () => {
      const res = await fetch(`${BASE}/admin/uav/configurations?order_id=${fakeOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      const items = data.snapshots[0].snapshot_data.items;
      const componentTypes = items.map((i: any) => i.component_type);
      expect(componentTypes).toContain("FRAME");
      expect(componentTypes).toContain("MOTOR");
      expect(componentTypes).toContain("BATTERY");
      for (const item of items) {
        expect(item.product_variant_id).toBeDefined();
        expect(item.sku).toBeDefined();
        expect(item.product_title).toBeDefined();
      }
    });

    it("snapshot contains validation result", async () => {
      const res = await fetch(`${BASE}/admin/uav/configurations?order_id=${fakeOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      const validation = data.snapshots[0].snapshot_data.validation;
      expect(validation).toBeDefined();
      expect(typeof validation.valid).toBe("boolean");
    });

    it("snapshot immutable after product metadata change", async () => {
      // Get snapshot before
      const beforeRes = await fetch(`${BASE}/admin/uav/configurations?order_id=${fakeOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const beforeData = await beforeRes.json();
      const beforeSpecs = JSON.stringify(beforeData.snapshots[0].snapshot_data);

      // Find the motor product specifically
      const productRes = await fetch(`${BASE}/admin/products?limit=100`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const { products } = await productRes.json();
      const motorProduct = products.find((p: any) => p.metadata?.component_type === "MOTOR");
      const productId = motorProduct?.id || products[0].id;

      // Save original specs for restore
      const origSpecs = motorProduct?.metadata || {};

      await fetch(`${BASE}/admin/products/${productId}/specs`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          component_type: "MOTOR",
          specs: { weight_g: "999", kv: "9999", max_current_a: "99" },
        }),
      });

      // Get snapshot after — must be unchanged
      const afterRes = await fetch(`${BASE}/admin/uav/configurations?order_id=${fakeOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const afterData = await afterRes.json();
      const afterSpecs = JSON.stringify(afterData.snapshots[0].snapshot_data);

      expect(afterSpecs).toBe(beforeSpecs);

      // Restore original specs
      await fetch(`${BASE}/admin/products/${productId}/specs`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          component_type: "MOTOR",
          specs: { weight_g: origSpecs.weight_g || "156", kv: origSpecs.kv || "400", max_current_a: origSpecs.max_current_a || "30" },
        }),
      });
    });

    it("handles multiple configs per order", async () => {
      const secondOrderId = `order_multi_${Date.now()}`;

      // First config with frame + motor
      await fetch(`${BASE}/store/uav/order-snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
        body: JSON.stringify({
          order_id: secondOrderId,
          items: [
            { variant_id: TEST_VARIANT_IDS[0], quantity: 1 },
            { variant_id: TEST_VARIANT_IDS[3], quantity: 4 },
          ],
        }),
      });

      const res = await fetch(`${BASE}/admin/uav/configurations?order_id=${secondOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      expect(data.snapshots.length).toBe(1);
      expect(data.snapshots[0].order_id).toBe(secondOrderId);
    });

    it("returns empty for non-UAV order", async () => {
      const res = await fetch(`${BASE}/store/uav/order-snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
        body: JSON.stringify({
          order_id: `order_empty_${Date.now()}`,
          items: [{ variant_id: "variant_nonexistent", quantity: 1 }],
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.snapshot_ids).toHaveLength(0);
    });

    it("rejects missing order_id", async () => {
      const res = await fetch(`${BASE}/store/uav/order-snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
        body: JSON.stringify({ items: [{ variant_id: "x", quantity: 1 }] }),
      });
      expect(res.status).toBe(400);
    });

    it("no snapshot for order that doesn't exist returns empty", async () => {
      const res = await fetch(`${BASE}/admin/uav/configurations?order_id=order_doesnt_exist`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.snapshots).toHaveLength(0);
    });
  });
});
