import { describe, test, expect, beforeAll } from "vitest";

const BASE = "http://localhost:9000";
const PK = "pk_11e52cb93d15418c56289d434fee7c53a391460b6a393b72ad48192afe3c4816";
const REGION_ID = "reg_01M4EBVQ7AW00SGW5JEMPAABK3";

const storeHeaders = {
  "Content-Type": "application/json",
  "x-publishable-api-key": PK,
};

async function storeApi(path: string, method = "GET", body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: storeHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

let adminToken = "";

async function adminApi(path: string, method = "GET", body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

beforeAll(async () => {
  const { data } = await storeApi("/auth/user/emailpass", "POST", {
    email: "admin@skyrostore.com",
    password: "admin123",
  });
  adminToken = data.token;
});

describe("Product Retrieval", () => {
  test("store API returns products", async () => {
    const { status, data } = await storeApi(
      `/store/products?limit=10&region_id=${REGION_ID}`
    );
    expect(status).toBe(200);
    expect(data.count).toBeGreaterThan(0);
    expect(data.products.length).toBeGreaterThan(0);
  });

  test("product has title, handle, and variants", async () => {
    const { data } = await storeApi(`/store/products?limit=1&region_id=${REGION_ID}`);
    const product = data.products[0];
    expect(product.title).toBeTruthy();
    expect(product.handle).toBeTruthy();
    expect(product.variants.length).toBeGreaterThan(0);
  });

  test("product has calculated price with region", async () => {
    const { data } = await storeApi(
      `/store/products?limit=1&region_id=${REGION_ID}&fields=%2Bvariants.calculated_price`
    );
    const variant = data.products[0].variants[0];
    expect(variant.calculated_price).toBeTruthy();
    expect(variant.calculated_price.calculated_amount).toBeGreaterThan(0);
    expect(variant.calculated_price.currency_code).toBe("inr");
  });

  test("product by handle returns correct product", async () => {
    const { data } = await storeApi(
      `/store/products?handle=dev-skyrox4-quadcopter&limit=1`
    );
    expect(data.products.length).toBe(1);
    expect(data.products[0].handle).toBe("dev-skyrox4-quadcopter");
  });

  test("product search works", async () => {
    const { data } = await storeApi(`/store/products?q=quadcopter&limit=5`);
    expect(data.products.length).toBeGreaterThan(0);
    expect(
      data.products.some((p: { title: string }) =>
        p.title.toLowerCase().includes("quadcopter")
      )
    ).toBe(true);
  });
});

describe("Cart Operations", () => {
  let cartId = "";
  let variantId = "";
  let lineItemId = "";

  beforeAll(async () => {
    const { data } = await storeApi(`/store/products?limit=1`);
    variantId = data.products[0].variants[0].id;
  });

  test("create cart", async () => {
    const { status, data } = await storeApi("/store/carts", "POST", {
      region_id: REGION_ID,
    });
    expect(status).toBe(200);
    expect(data.cart.id).toBeTruthy();
    cartId = data.cart.id;
  });

  test("add item to cart", async () => {
    const { status, data } = await storeApi(
      `/store/carts/${cartId}/line-items`,
      "POST",
      { variant_id: variantId, quantity: 1 }
    );
    expect(status).toBe(200);
    expect(data.cart.items.length).toBe(1);
    lineItemId = data.cart.items[0].id;
  });

  test("update line item quantity", async () => {
    const { status, data } = await storeApi(
      `/store/carts/${cartId}/line-items/${lineItemId}`,
      "POST",
      { quantity: 3 }
    );
    expect(status).toBe(200);
    expect(data.cart.items[0].quantity).toBe(3);
  });

  test("cart total reflects quantity", async () => {
    const { data } = await storeApi(`/store/carts/${cartId}`);
    expect(data.cart.items[0].quantity).toBe(3);
    expect(data.cart.total).toBeGreaterThan(0);
  });

  test("remove line item", async () => {
    const { status, data } = await storeApi(
      `/store/carts/${cartId}/line-items/${lineItemId}`,
      "DELETE"
    );
    expect(status).toBe(200);
    expect(data.parent.items.length).toBe(0);
  });
});

describe("Full Checkout", () => {
  let cartId = "";
  let orderId = "";

  test("create cart and add item", async () => {
    const { data: cartData } = await storeApi("/store/carts", "POST", {
      region_id: REGION_ID,
    });
    cartId = cartData.cart.id;

    const { data: prodData } = await storeApi(`/store/products?limit=1`);
    const variantId = prodData.products[0].variants[0].id;

    const { status } = await storeApi(
      `/store/carts/${cartId}/line-items`,
      "POST",
      { variant_id: variantId, quantity: 1 }
    );
    expect(status).toBe(200);
  });

  test("set customer email and address", async () => {
    const { status, data } = await storeApi(
      `/store/carts/${cartId}`,
      "POST",
      {
        email: "test-integration@skyrostore.dev",
        shipping_address: {
          first_name: "Integration",
          last_name: "Test",
          address_1: "456 Test Ave",
          city: "Bhubaneswar",
          province: "Odisha",
          postal_code: "751002",
          country_code: "in",
          phone: "9999999999",
        },
        billing_address: {
          first_name: "Integration",
          last_name: "Test",
          address_1: "456 Test Ave",
          city: "Bhubaneswar",
          province: "Odisha",
          postal_code: "751002",
          country_code: "in",
          phone: "9999999999",
        },
      }
    );
    expect(status).toBe(200);
    expect(data.cart.email).toBe("test-integration@skyrostore.dev");
  });

  test("add shipping method", async () => {
    const { data: optData } = await storeApi(
      `/store/shipping-options?cart_id=${cartId}`
    );
    expect(optData.shipping_options.length).toBeGreaterThan(0);

    const { status, data } = await storeApi(
      `/store/carts/${cartId}/shipping-methods`,
      "POST",
      { option_id: optData.shipping_options[0].id }
    );
    expect(status).toBe(200);
    expect(data.cart.shipping_methods.length).toBeGreaterThan(0);
  });

  test("create payment collection and session", async () => {
    const { status: pcStatus, data: pcData } = await storeApi(
      `/store/payment-collections`,
      "POST",
      { cart_id: cartId }
    );
    expect(pcStatus).toBe(200);
    const pcId = pcData.payment_collection.id;

    const { status: psStatus } = await storeApi(
      `/store/payment-collections/${pcId}/payment-sessions`,
      "POST",
      { provider_id: "pp_system_default" }
    );
    expect(psStatus).toBe(200);
  });

  test("complete cart creates order", async () => {
    const { status, data } = await storeApi(
      `/store/carts/${cartId}/complete`,
      "POST"
    );
    expect(status).toBe(200);
    expect(data.type).toBe("order");
    expect(data.order.id).toBeTruthy();
    expect(data.order.status).toBe("pending");
    orderId = data.order.id;
  });

  test("order appears in admin", async () => {
    const { status, data } = await adminApi(
      `/admin/orders/${orderId}`
    );
    expect(status).toBe(200);
    expect(data.order.id).toBe(orderId);
  });
});

describe("Inventory", () => {
  test("SKU has stock", async () => {
    const { data } = await adminApi(
      `/admin/inventory-items?sku=DEV-UAV-X4-001&limit=1`
    );
    expect(data.inventory_items.length).toBe(1);
    expect(data.inventory_items[0].stocked_quantity).toBeGreaterThan(0);
  });

  test("reserved quantity reflects orders", async () => {
    const { data } = await adminApi(
      `/admin/inventory-items?sku=DEV-UAV-X4-001&limit=1`
    );
    expect(data.inventory_items[0].reserved_quantity).toBeGreaterThan(0);
  });
});

describe("Validation", () => {
  test("invalid variant ID returns error", async () => {
    const { data: cartData } = await storeApi("/store/carts", "POST", {
      region_id: REGION_ID,
    });
    const { status } = await storeApi(
      `/store/carts/${cartData.cart.id}/line-items`,
      "POST",
      { variant_id: "variant_INVALID", quantity: 1 }
    );
    expect(status).toBeGreaterThanOrEqual(400);
  });

  test("invalid cart ID returns error", async () => {
    const { status } = await storeApi(`/store/carts/cart_INVALID`);
    expect(status).toBeGreaterThanOrEqual(400);
  });

  test("quantity 0 is rejected", async () => {
    const { data: cartData } = await storeApi("/store/carts", "POST", {
      region_id: REGION_ID,
    });
    const { data: prodData } = await storeApi(`/store/products?limit=1`);

    const { status } = await storeApi(
      `/store/carts/${cartData.cart.id}/line-items`,
      "POST",
      { variant_id: prodData.products[0].variants[0].id, quantity: 0 }
    );
    expect(status).toBeGreaterThanOrEqual(400);
  });

  test("publishable key required for store routes", async () => {
    const res = await fetch(`${BASE}/store/products`, {
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
