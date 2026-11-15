import { describe, it, expect } from "vitest";
import { orderPlacedEmail } from "../apps/backend/src/lib/email";
import { buildPushOrder } from "../apps/backend/src/lib/shipmozo";
import { getEffectiveCustomerId } from "../apps/backend/src/lib/customer-id";

// Amounts are stored in paise everywhere; these guard the places that print or send rupees.
describe("paise to rupees", () => {
  it("order email shows rupees, not paise", () => {
    const { html } = orderPlacedEmail({ display_id: 7, currency_code: "inr", total: 1499900 });
    expect(html).toContain("14,999");
    expect(html).not.toContain("1,499,900");
  });

  it("Shipmozo declared value is in rupees", () => {
    const order = {
      id: "order_1",
      email: "a@b.in",
      shipping_address: { first_name: "A", phone: "9876543210", postal_code: "751001", address_1: "x", city: "Bhubaneswar", province: "Odisha" },
      items: [{ id: "i1", title: "Motor", quantity: 2, unit_price: 250000 }],
    };
    const body = buildPushOrder(order, { weight_g: 500, length_cm: 10, width_cm: 10, height_cm: 10 }, "wh_1");
    expect(body.product_detail[0].unit_price).toBe(2500);
  });
});

describe("visitor id", () => {
  const req = (headers: Record<string, string>, actor?: string) =>
    ({ headers, auth_context: actor ? { actor_id: actor } : undefined }) as any;

  it("prefers the signed-in customer", () => expect(getEffectiveCustomerId(req({ "x-visitor-id": "vis_abcdefgh" }, "cus_1"))).toBe("cus_1"));
  it("accepts a normal visitor id", () => expect(getEffectiveCustomerId(req({ "x-visitor-id": "vis_1234abcd-5678" }))).toBe("vis_1234abcd-5678"));
  it("never lets a caller claim a customer or admin id", () => {
    expect(getEffectiveCustomerId(req({ "x-visitor-id": "cus_01HABCDEFGH" }))).toBeNull();
    expect(getEffectiveCustomerId(req({ "x-visitor-id": "user_01HABCDEFGH" }))).toBeNull();
  });
  it("has no id for junk ids", () => {
    expect(getEffectiveCustomerId(req({ "x-visitor-id": "a b;drop" }))).toBeNull();
    expect(getEffectiveCustomerId(req({}))).toBeNull();
  });
});
