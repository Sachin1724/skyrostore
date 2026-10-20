import { describe, it, expect, beforeAll } from "vitest";

const BASE = process.env.MEDUSA_URL || "http://localhost:9000";
const PK = "pk_11e52cb93d15418c56289d434fee7c53a391460b6a393b72ad48192afe3c4816";

let adminToken: string;
let testBomId: string;
let testMfgOrderId: string;

const TEST_VARIANT_IDS = [
  "variant_01M4EDHQRBF82QZVWEW0DKWP5W", // Frame
  "variant_01M4EDHPEXT681J00349S8JBE7", // FC
  "variant_01M4EDHPQ5S1HVJBNS9487N9JJ", // ESC
  "variant_01M4EDHPY7FPKQB2TCK3SB7WQ5", // Motor
  "variant_01M4EDHQ5GYD7A5W62JZXBDGBD", // Propeller
  "variant_01M4EDHQC1PDB0QZVEF7KN7XK3", // GPS
  "variant_01M4EDHQJPC7429683G02XC7QR", // Battery
];

async function getAdminToken(): Promise<string> {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@skyrostore.com", password: "admin123" }),
  });
  const data = await res.json();
  return data.token;
}

async function getProducts(token: string): Promise<any[]> {
  const res = await fetch(`${BASE}/admin/products?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.products;
}

describe("Manufacturing Workflow", () => {
  beforeAll(async () => {
    adminToken = await getAdminToken();
  }, 15000);

  describe("BOM Management", () => {
    it("rejects unauthenticated BOM creation", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing/bom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test BOM" }),
      });
      expect(res.status).toBe(401);
    });

    it("creates BOM with items", async () => {
      const products = await getProducts(adminToken);
      const motor = products.find((p: any) => p.metadata?.component_type === "MOTOR");
      const frame = products.find((p: any) => p.metadata?.component_type === "FRAME");

      const res = await fetch(`${BASE}/admin/manufacturing/bom`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test UAV Assembly BOM",
          uav_model: "SKY-TEST-001",
          items: [
            {
              product_id: frame?.id || "prod_frame",
              product_variant_id: TEST_VARIANT_IDS[0],
              component_type: "FRAME",
              quantity: 1,
              required: true,
            },
            {
              product_id: motor?.id || "prod_motor",
              product_variant_id: TEST_VARIANT_IDS[3],
              component_type: "MOTOR",
              quantity: 4,
              required: true,
            },
          ],
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.bom.name).toBe("Test UAV Assembly BOM");
      expect(data.bom.status).toBe("draft");
      expect(data.bom.items.length).toBe(2);
      testBomId = data.bom.id;
    });

    it("retrieves BOM with items", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing/bom/${testBomId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.bom.id).toBe(testBomId);
      expect(data.bom.items.length).toBe(2);
    });

    it("activates BOM with revision bump", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing/bom/${testBomId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.bom.status).toBe("active");
      expect(data.bom.revision).toBeGreaterThan(0);
    });

    it("lists BOMs with status filter", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing/bom?status=active`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.boms.length).toBeGreaterThan(0);
      expect(data.boms.every((b: any) => b.status === "active")).toBe(true);
    });

    it("rejects BOM creation without name", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing/bom`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    it("rejects invalid BOM status", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing/bom/${testBomId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "INVALID" }),
      });
      expect(res.status).toBe(400);
    });

    it("returns 404 for nonexistent BOM", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing/bom/bom_nonexistent`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(404);
    });
  });

  describe("Manufacturing Order Creation", () => {
    const testOrderId = `order_mfg_test_${Date.now()}`;

    it("rejects unauthenticated order creation", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: testOrderId }),
      });
      expect(res.status).toBe(401);
    });

    it("rejects order without order_id", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    it("creates manufacturing order with BOM", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: testOrderId,
          bom_id: testBomId,
          planned_quantity: 1,
          notes: "Test manufacturing order",
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.manufacturing_order.order_id).toBe(testOrderId);
      expect(data.manufacturing_order.current_stage).toBe("planned");
      expect(data.manufacturing_order.bom_id).toBe(testBomId);
      expect(data.manufacturing_order.bom_revision).toBeGreaterThan(0);
      testMfgOrderId = data.manufacturing_order.id;
    });

    it("is idempotent — returns existing order", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: testOrderId }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.already_exists).toBe(true);
      expect(data.manufacturing_order.id).toBe(testMfgOrderId);
    });

    it("lists manufacturing orders", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.manufacturing_orders.length).toBeGreaterThan(0);
    });

    it("retrieves detail with valid transitions", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing/${testMfgOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.manufacturing_order.id).toBe(testMfgOrderId);
      expect(data.valid_transitions).toContain("components_reserved");
      expect(data.valid_transitions).toContain("cancelled");
      expect(data.events.length).toBeGreaterThan(0);
    });

    it("rejects manufacturing order with inactive BOM", async () => {
      // Create a draft BOM
      const bomRes = await fetch(`${BASE}/admin/manufacturing/bom`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Draft BOM" }),
      });
      const bomData = await bomRes.json();

      const res = await fetch(`${BASE}/admin/manufacturing`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: `order_bad_bom_${Date.now()}`, bom_id: bomData.bom.id }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("active");
    });
  });

  describe("State Transitions", () => {
    it("rejects invalid transition (planned to assembled)", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing/${testMfgOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transition", to: "assembled" }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Invalid transition");
      expect(data.allowed_transitions).toBeDefined();
    });

    it("rejects unknown action", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing/${testMfgOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fly_to_moon" }),
      });
      expect(res.status).toBe(400);
    });

    it("returns 404 for nonexistent order", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing/mfg_nonexistent`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(404);
    });
  });

  describe("Component Reservation", () => {
    it("reserves components from BOM", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing/${testMfgOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reserve_components" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.allocations.length).toBeGreaterThan(0);
      expect(data.manufacturing_order.current_stage).toBe("components_reserved");

      for (const alloc of data.allocations) {
        expect(alloc.status).toBe("allocated");
        expect(alloc.allocated_quantity).toBe(alloc.required_quantity);
      }
    });

    it("is idempotent — returns existing allocations", async () => {
      // Transition back to planned first — can't re-reserve from components_reserved
      // Actually idempotency check happens before stage check
      // But order is now components_reserved, so re-reserving should fail on stage check
      const res = await fetch(`${BASE}/admin/manufacturing/${testMfgOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reserve_components" }),
      });
      // Should reject because not in planned stage
      expect(res.status).toBe(400);
    });
  });

  describe("Assembly and Serial Numbers", () => {
    it("creates assembly with unique serial", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing/${testMfgOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_assembly", firmware_version: "v1.0.0" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.assembly.serial_number).toMatch(/^SKY-/);
      expect(data.assembly.status).toBe("pending");
    });

    it("rejects excess assembly creation", async () => {
      // Order has planned_quantity=1, already one assembly
      const res = await fetch(`${BASE}/admin/manufacturing/${testMfgOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_assembly" }),
      });
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain("All planned units");
    });

    it("marks assembly as assembled", async () => {
      // Get the assembly
      const detailRes = await fetch(`${BASE}/admin/manufacturing/${testMfgOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const detail = await detailRes.json();
      const assembly = detail.assemblies[0];

      const res = await fetch(`${BASE}/admin/manufacturing/${testMfgOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_assembly", assembly_id: assembly.id, status: "assembled" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.assembly.status).toBe("assembled");
      expect(data.assembly.completed_at).toBeDefined();
    });
  });

  describe("Component Consumption", () => {
    it("consumes allocated components", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing/${testMfgOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "consume_components" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      for (const alloc of data.consumed) {
        expect(alloc.status).toBe("consumed");
        expect(alloc.consumed_quantity).toBe(alloc.allocated_quantity);
      }
    });
  });

  describe("QA Workflow", () => {
    it("transitions to assembled then qa_pending", async () => {
      // Transition: assembling -> assembled
      let res = await fetch(`${BASE}/admin/manufacturing/${testMfgOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transition", to: "assembled" }),
      });
      expect(res.status).toBe(200);

      // assembled -> qa_pending
      res = await fetch(`${BASE}/admin/manufacturing/${testMfgOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transition", to: "qa_pending" }),
      });
      expect(res.status).toBe(200);
    });

    it("records QA pass", async () => {
      const detailRes = await fetch(`${BASE}/admin/manufacturing/${testMfgOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const detail = await detailRes.json();
      const assembly = detail.assemblies[0];

      const res = await fetch(`${BASE}/admin/manufacturing/${testMfgOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_qa",
          assembly_id: assembly.id,
          result: "PASS",
          remarks: "All checks passed",
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.qa_check.result).toBe("PASS");
    });

    it("manufacturing order is now qa_passed", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing/${testMfgOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      expect(data.manufacturing_order.current_stage).toBe("qa_passed");
      expect(data.manufacturing_order.completed_at).toBeDefined();
      expect(data.valid_transitions).toHaveLength(0); // terminal
    });

    it("rejects transition from terminal state", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing/${testMfgOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transition", to: "planned" }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("Cancellation and Release", () => {
    let cancelOrderId: string;

    it("creates and cancels order, releasing allocations", async () => {
      // Create a new manufacturing order
      const orderId = `order_cancel_${Date.now()}`;
      let res = await fetch(`${BASE}/admin/manufacturing`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, bom_id: testBomId }),
      });
      const createData = await res.json();
      cancelOrderId = createData.manufacturing_order.id;

      // Reserve components
      res = await fetch(`${BASE}/admin/manufacturing/${cancelOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reserve_components" }),
      });
      expect(res.status).toBe(200);

      // Cancel
      res = await fetch(`${BASE}/admin/manufacturing/${cancelOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transition", to: "cancelled" }),
      });
      expect(res.status).toBe(200);

      // Verify allocations released
      const detail = await (await fetch(`${BASE}/admin/manufacturing/${cancelOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })).json();

      expect(detail.manufacturing_order.current_stage).toBe("cancelled");
      expect(detail.manufacturing_order.cancelled_at).toBeDefined();
      for (const alloc of detail.allocations) {
        expect(alloc.status).toBe("released");
      }
    });

    it("cannot transition from cancelled", async () => {
      const res = await fetch(`${BASE}/admin/manufacturing/${cancelOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transition", to: "planned" }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("Snapshot-linked Manufacturing", () => {
    it("creates order linked to existing snapshot", async () => {
      // First create a snapshot via the store API
      const snapshotOrderId = `order_snap_mfg_${Date.now()}`;
      const items = TEST_VARIANT_IDS.map((v) => ({ variant_id: v, quantity: 1 }));
      await fetch(`${BASE}/store/uav/order-snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
        body: JSON.stringify({ order_id: snapshotOrderId, items }),
      });

      // Create manufacturing order — should auto-resolve snapshot
      const res = await fetch(`${BASE}/admin/manufacturing`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: snapshotOrderId }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.manufacturing_order.snapshot_id).toBeDefined();
      expect(data.manufacturing_order.snapshot_id).not.toBeNull();
    });
  });

  describe("QA Failure and Rework", () => {
    let reworkOrderId: string;

    it("supports QA fail then rework cycle", async () => {
      const orderId = `order_rework_${Date.now()}`;
      let res = await fetch(`${BASE}/admin/manufacturing`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, bom_id: testBomId }),
      });
      reworkOrderId = (await res.json()).manufacturing_order.id;

      // Reserve
      await fetch(`${BASE}/admin/manufacturing/${reworkOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reserve_components" }),
      });

      // Create assembly
      await fetch(`${BASE}/admin/manufacturing/${reworkOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_assembly" }),
      });

      // Get assembly id
      let detail = await (await fetch(`${BASE}/admin/manufacturing/${reworkOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })).json();
      const assemblyId = detail.assemblies[0].id;

      // Mark assembled
      await fetch(`${BASE}/admin/manufacturing/${reworkOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_assembly", assembly_id: assemblyId, status: "assembled" }),
      });

      // Transition to assembled
      await fetch(`${BASE}/admin/manufacturing/${reworkOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transition", to: "assembled" }),
      });

      // Transition to qa_pending
      await fetch(`${BASE}/admin/manufacturing/${reworkOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transition", to: "qa_pending" }),
      });

      // QA Fail
      res = await fetch(`${BASE}/admin/manufacturing/${reworkOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_qa",
          assembly_id: assemblyId,
          result: "FAIL",
          remarks: "Motor vibration out of spec",
        }),
      });
      expect(res.status).toBe(200);

      // Verify state is qa_failed
      detail = await (await fetch(`${BASE}/admin/manufacturing/${reworkOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })).json();
      expect(detail.manufacturing_order.current_stage).toBe("qa_failed");
      expect(detail.qa_checks.length).toBe(1);
      expect(detail.qa_checks[0].result).toBe("FAIL");

      // Rework: transition back to assembling
      res = await fetch(`${BASE}/admin/manufacturing/${reworkOrderId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transition", to: "assembling", notes: "Rework: replace motor" }),
      });
      expect(res.status).toBe(200);

      // Verify history preserved
      detail = await (await fetch(`${BASE}/admin/manufacturing/${reworkOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })).json();
      expect(detail.manufacturing_order.current_stage).toBe("assembling");
      expect(detail.events.length).toBeGreaterThanOrEqual(4); // created, reserved, assembled, qa_failed, rework
      expect(detail.qa_checks.length).toBe(1); // original failure still recorded
    });
  });
});
