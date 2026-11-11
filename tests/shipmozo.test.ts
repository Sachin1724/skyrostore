import { describe, it, expect } from "vitest";
import {
  buildPushOrder,
  isDeliveredStatus,
  normalisePhone,
  validatePackage,
} from "../apps/backend/src/lib/shipmozo";
import { toMedusaAddress, validCheckoutSignature } from "../apps/backend/src/lib/razorpay-checkout";
import crypto from "crypto";

const order = {
  id: "order_01",
  email: "buyer@example.com",
  created_at: "2026-11-02T10:00:00Z",
  shipping_address: {
    first_name: "Asha",
    last_name: "Rao",
    address_1: "12 MG Road",
    city: "Bhubaneswar",
    province: "Odisha",
    postal_code: "751001",
    phone: "+91 98765 43210",
  },
  items: [{ id: "li_1", title: "ESC 50A", variant_sku: "ESC-50", unit_price: 499900, quantity: 2 }],
};

describe("shipmozo", () => {
  it("maps a Medusa order to push-order", () => {
    const body = buildPushOrder(order, { weight_g: 800, length_cm: 20, width_cm: 15, height_cm: 10 }, "23481");
    expect(body.order_id).toBe("order_01");
    expect(body.order_date).toBe("2026-11-02");
    expect(body.consignee_phone).toBe(9876543210);
    expect(body.consignee_pin_code).toBe(751001);
    expect(body.payment_type).toBe("PREPAID");
    expect(body.product_detail[0]).toMatchObject({ sku_number: "ESC-50", quantity: 2 });
    expect(body.warehouse_id).toBe("23481");
  });

  it("refuses an address the courier cannot use", () => {
    const pkg = { weight_g: 1, length_cm: 1, width_cm: 1, height_cm: 1 };
    expect(() => buildPushOrder({ ...order, shipping_address: { ...order.shipping_address, phone: "123" } }, pkg, "1")).toThrow(/mobile/);
    expect(() => buildPushOrder({ ...order, shipping_address: { ...order.shipping_address, postal_code: "7510" } }, pkg, "1")).toThrow(/PIN/);
  });

  it("validates package and phone", () => {
    expect(validatePackage({ weight_g: 0, length_cm: 1, width_cm: 1, height_cm: 1 })).toHaveProperty("error");
    expect(validatePackage({ weight_g: "500", length_cm: 10, width_cm: 10, height_cm: 10 })).toEqual({
      pkg: { weight_g: 500, length_cm: 10, width_cm: 10, height_cm: 10 },
    });
    expect(normalisePhone("09876543210")).toBe(9876543210);
    expect(normalisePhone("12345")).toBeNull();
  });

  it("only treats real delivery as delivered", () => {
    expect(isDeliveredStatus("Delivered")).toBe(true);
    expect(isDeliveredStatus("Undelivered")).toBe(false);
    expect(isDeliveredStatus("RTO Delivered")).toBe(false);
    expect(isDeliveredStatus("In Transit")).toBe(false);
  });
});

describe("razorpay magic checkout", () => {
  it("maps customer_details address", () => {
    const a = toMedusaAddress(
      { name: "Asha Rao", line1: "12 MG Road", zipcode: "751001", city: "Bhubaneswar", state: "Odisha", country: "IN" },
      { contact: "+919876543210" }
    );
    expect(a).toMatchObject({ first_name: "Asha", last_name: "Rao", postal_code: "751001", country_code: "in", phone: "+919876543210" });
  });

  it("verifies checkout signature", () => {
    process.env.RAZORPAY_KEY_SECRET = "test_secret";
    const sig = crypto.createHmac("sha256", "test_secret").update("order_1|pay_1").digest("hex");
    expect(validCheckoutSignature("order_1", "pay_1", sig)).toBe(true);
    expect(validCheckoutSignature("order_1", "pay_2", sig)).toBe(false);
    expect(validCheckoutSignature("order_1", "pay_1", "zz")).toBe(false);
  });
});
