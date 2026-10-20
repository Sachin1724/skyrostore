import { describe, it, expect, beforeAll } from "vitest";
import { filterPublicMetadata, COMPONENT_SPEC_FIELDS } from "../apps/backend/src/lib/compatibility/spec-fields";

const BASE = process.env.MEDUSA_URL || "http://localhost:9000";

let adminToken: string;
let testProductId: string;

async function getAdminToken(): Promise<string> {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@skyrostore.com", password: "admin123" }),
  });
  const data = await res.json();
  return data.token;
}

async function getFirstProduct(token: string): Promise<string> {
  const res = await fetch(`${BASE}/admin/products?limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.products[0].id;
}

describe("Admin Product Specifications", () => {
  beforeAll(async () => {
    adminToken = await getAdminToken();
    testProductId = await getFirstProduct(adminToken);
  }, 15000);

  describe("Authentication", () => {
    it("rejects unauthenticated spec read", async () => {
      const res = await fetch(`${BASE}/admin/products/${testProductId}/specs`);
      expect(res.status).toBe(401);
    });

    it("rejects unauthenticated spec write", async () => {
      const res = await fetch(`${BASE}/admin/products/${testProductId}/specs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ component_type: "MOTOR", specs: { kv: "400", weight_g: "156" } }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /admin/products/:id/specs", () => {
    it("returns product spec data with field definitions", async () => {
      const res = await fetch(`${BASE}/admin/products/${testProductId}/specs`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.product_id).toBe(testProductId);
      expect(data).toHaveProperty("available_types");
      expect(data.available_types).toContain("MOTOR");
      expect(data.available_types).toContain("FRAME");
      expect(data.available_types).toContain("BATTERY");
    });

    it("returns 404 for nonexistent product", async () => {
      const res = await fetch(`${BASE}/admin/products/prod_nonexistent/specs`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /admin/products/:id/specs", () => {
    it("saves motor specs with valid canonical fields", async () => {
      const res = await fetch(`${BASE}/admin/products/${testProductId}/specs`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          component_type: "MOTOR",
          specs: {
            weight_g: "156",
            kv: "400",
            max_current_a: "30",
          },
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.component_type).toBe("MOTOR");
      expect(data.metadata.kv).toBe("400");
      expect(data.metadata.weight_g).toBe("156");
    });

    it("retrieves saved specs correctly", async () => {
      // Re-set specs to known values (parallel tests may modify this product)
      await fetch(`${BASE}/admin/products/${testProductId}/specs`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ component_type: "MOTOR", specs: { weight_g: "156", kv: "400", max_current_a: "30" } }),
      });
      const res = await fetch(`${BASE}/admin/products/${testProductId}/specs`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      expect(data.component_type).toBe("MOTOR");
      expect(data.specs.kv).toBe("400");
      expect(data.specs.weight_g).toBe("156");
    });

    it("rejects invalid component type", async () => {
      const res = await fetch(`${BASE}/admin/products/${testProductId}/specs`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          component_type: "INVALID_TYPE",
          specs: { weight_g: "100" },
        }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Unknown component type");
    });

    it("rejects out-of-range spec values", async () => {
      const res = await fetch(`${BASE}/admin/products/${testProductId}/specs`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          component_type: "MOTOR",
          specs: {
            weight_g: "0",
            kv: "99999",
          },
        }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.field_errors).toBeDefined();
      expect(data.field_errors.weight_g).toBeDefined();
      expect(data.field_errors.kv).toBeDefined();
    });

    it("rejects non-numeric values for numeric fields", async () => {
      const res = await fetch(`${BASE}/admin/products/${testProductId}/specs`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          component_type: "BATTERY",
          specs: {
            weight_g: "heavy",
            cell_count: "six",
            voltage_v: "22.2",
            capacity_mah: "5000",
            continuous_discharge_a: "50",
          },
        }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.field_errors.weight_g).toContain("number");
      expect(data.field_errors.cell_count).toContain("number");
    });

    it("saves custom specs alongside canonical fields", async () => {
      const res = await fetch(`${BASE}/admin/products/${testProductId}/specs`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          component_type: "MOTOR",
          specs: { weight_g: "156", kv: "400", max_current_a: "30" },
          custom_specs: { connector_type: "XT60", bearing_type: "EZO" },
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.metadata.connector_type).toBe("XT60");
      expect(data.metadata.bearing_type).toBe("EZO");
    });

    it("retrieves custom specs separately from canonical", async () => {
      const res = await fetch(`${BASE}/admin/products/${testProductId}/specs`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      expect(data.custom_specs.connector_type).toBe("XT60");
      expect(data.custom_specs.bearing_type).toBe("EZO");
      expect(data.specs.kv).toBe("400");
    });

    it("rejects custom spec key that conflicts with canonical field", async () => {
      const res = await fetch(`${BASE}/admin/products/${testProductId}/specs`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          component_type: "MOTOR",
          specs: { weight_g: "156", kv: "400", max_current_a: "30" },
          custom_specs: { kv: "should_fail" },
        }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("conflicts with canonical");
    });

    it("rejects component_type as custom spec", async () => {
      const res = await fetch(`${BASE}/admin/products/${testProductId}/specs`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          component_type: "MOTOR",
          specs: { weight_g: "156", kv: "400", max_current_a: "30" },
          custom_specs: { component_type: "BATTERY" },
        }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /admin/products/specs (list)", () => {
    it("returns product list with spec info", async () => {
      const res = await fetch(`${BASE}/admin/products/specs`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.products).toBeDefined();
      expect(Array.isArray(data.products)).toBe(true);
      expect(data.products.length).toBeGreaterThan(0);
      expect(data.available_types).toBeDefined();
      expect(data.field_definitions).toBeDefined();

      const product = data.products.find((p: any) => p.id === testProductId);
      expect(product).toBeDefined();
      expect(product.component_type).toBe("MOTOR");
    });
  });

  describe("Compatibility engine consumes saved specs", () => {
    it("saved product metadata readable via store API", async () => {
      const PK = "pk_11e52cb93d15418c56289d434fee7c53a391460b6a393b72ad48192afe3c4816";

      // Get product handle
      const adminRes = await fetch(`${BASE}/admin/products/${testProductId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const adminData = await adminRes.json();
      const handle = adminData.product.handle;

      // Fetch via store API with metadata field
      const storeRes = await fetch(`${BASE}/store/products?handle=${handle}&fields=+metadata`, {
        headers: { "x-publishable-api-key": PK },
      });
      expect(storeRes.status).toBe(200);
      const storeData = await storeRes.json();
      const product = storeData.products?.[0];
      expect(product).toBeDefined();
      expect(product.metadata).toBeDefined();
      expect(product.metadata.component_type).toBe("MOTOR");
      expect(product.metadata.kv).toBe("400");
      expect(product.metadata.weight_g).toBe("156");
    });
  });

  describe("Customer-visible filtering", () => {
    it("admin can save internal-only fields via specs", async () => {
      const res = await fetch(`${BASE}/admin/products/${testProductId}/specs`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          component_type: "MOTOR",
          specs: { weight_g: "156", kv: "400", max_current_a: "30", internal_batch_code: "BATCH-2026-Q4", qa_test_result: "PASS" },
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.metadata.internal_batch_code).toBe("BATCH-2026-Q4");
      expect(data.metadata.qa_test_result).toBe("PASS");
    });

    it("admin GET returns internal fields in specs", async () => {
      const res = await fetch(`${BASE}/admin/products/${testProductId}/specs`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      expect(data.specs.internal_batch_code).toBe("BATCH-2026-Q4");
      expect(data.specs.qa_test_result).toBe("PASS");
    });

    it("filterPublicMetadata strips internal keys", () => {
      const metadata = {
        component_type: "MOTOR",
        kv: "400",
        weight_g: "156",
        internal_batch_code: "BATCH-2026-Q4",
        qa_test_result: "PASS",
        connector_type: "XT60",
      };
      const filtered = filterPublicMetadata(metadata);
      expect(filtered).not.toBeNull();
      expect(filtered!.component_type).toBe("MOTOR");
      expect(filtered!.kv).toBe("400");
      expect(filtered!.weight_g).toBe("156");
      expect(filtered!.connector_type).toBe("XT60");
      expect(filtered!.internal_batch_code).toBeUndefined();
      expect(filtered!.qa_test_result).toBeUndefined();
    });

    it("filterPublicMetadata handles null/undefined", () => {
      expect(filterPublicMetadata(null)).toBeNull();
      expect(filterPublicMetadata(undefined)).toBeNull();
    });

    it("filterPublicMetadata preserves all public fields", () => {
      const metadata = {
        component_type: "FRAME",
        weight_g: "320",
        motor_count: "4",
        wheelbase_mm: "450",
        frame_material: "Carbon Fiber",
      };
      const filtered = filterPublicMetadata(metadata);
      expect(Object.keys(filtered!)).toHaveLength(5);
    });

    it("does not convert missing values to zero", () => {
      const metadata = {
        component_type: "MOTOR",
        kv: "400",
      };
      const filtered = filterPublicMetadata(metadata);
      expect(filtered!.weight_g).toBeUndefined();
      expect(filtered!.max_current_a).toBeUndefined();
    });

    it("internal keys list matches spec-fields definitions", () => {
      const internalFromDefs = new Set<string>();
      for (const fields of Object.values(COMPONENT_SPEC_FIELDS)) {
        for (const f of fields) {
          if (!f.customer_visible) internalFromDefs.add(f.key);
        }
      }
      expect(internalFromDefs.size).toBeGreaterThan(0);
      for (const key of internalFromDefs) {
        const meta = { [key]: "test_value", component_type: "MOTOR" };
        const filtered = filterPublicMetadata(meta);
        expect(filtered![key]).toBeUndefined();
      }
    });
  });
});
