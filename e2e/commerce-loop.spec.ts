import { test, expect } from "@playwright/test";

test.describe("Commerce Loop E2E", () => {
  test("homepage loads with products", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Professional UAVs");
    // Products should load from Medusa
    await expect(page.locator("body")).toContainText("SkyroX4");
  });

  test("product detail page renders from Medusa", async ({ page }) => {
    await page.goto("/products/dev-skyrox4-quadcopter");
    await expect(page.locator("h1")).toContainText("SkyroX4 Quadcopter");
    // Should show price (format: ₹89,999.00 or similar)
    await expect(page.locator("body")).toContainText("89,999");
    // Should show specs from metadata
    await expect(page.locator("body")).toContainText("carbon fiber", { timeout: 10000 });
  });

  test("add to cart flow", async ({ page }) => {
    await page.goto("/products/dev-skyrox4-quadcopter");

    const addBtn = page.locator("button:has-text('Add to Cart')");
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/cart/add") && r.status() === 200),
      addBtn.click(),
    ]);
    expect(response.ok()).toBe(true);

    await page.goto("/cart");
    await expect(page.locator("body")).toContainText("SkyroX4");
    await expect(page.locator("body")).toContainText("89,999");
  });

  test("full checkout creates order", async ({ page }) => {
    // Add product to cart
    await page.goto("/products/dev-pixhawk-6c-mini");
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/cart/add") && r.status() === 200),
      page.click("button:has-text('Add to Cart')"),
    ]);

    // Go to checkout
    await page.goto("/checkout");
    await expect(page.locator("h1")).toContainText("Checkout");

    // Fill address form
    await page.fill('input[placeholder="Email"]', "e2e-test@skyrostore.dev");
    await page.fill('input[placeholder="First name"]', "E2E");
    await page.fill('input[placeholder="Last name"]', "Tester");
    await page.fill('input[placeholder="Address"]', "789 E2E Road");
    await page.fill('input[placeholder="City"]', "Bhubaneswar");
    await page.fill('input[placeholder="State"]', "Odisha");
    await page.fill('input[placeholder="PIN code"]', "751003");

    // Submit address
    await page.click("button:has-text('Continue to Shipping')");
    await page.waitForTimeout(1000);

    // Shipping step
    await expect(page.locator("body")).toContainText("Standard Shipping");
    await page.click("button:has-text('Continue to Payment')");
    await page.waitForTimeout(1000);

    // Payment step
    await expect(page.locator("body")).toContainText("Place Order");
    await page.click("button:has-text('Place Order')");

    // Wait for order completion
    await page.waitForURL("**/checkout/confirmation**", { timeout: 15000 });
    await expect(page.locator("h1")).toContainText("Order Confirmed");
  });

  test("admin orders page shows orders", async ({ page }) => {
    // Login to admin
    await page.goto("http://localhost:3001/login");
    await page.fill('input[type="email"]', "admin@skyrostore.com");
    await page.fill('input[type="password"]', "admin123");
    await page.click("button:has-text('Sign In')");
    await page.waitForTimeout(2000);

    // Check orders page
    await page.goto("http://localhost:3001/orders");
    await page.waitForTimeout(3000);
    await expect(page.locator("h1")).toContainText("Orders");
    // Should show at least one order
    await expect(page.locator("body")).toContainText("pending");
  });

  test("search returns matching products", async ({ page }) => {
    await page.goto("/search?q=motor");
    await expect(page.locator("body")).toContainText("T-Motor");
  });

  test("parts page shows categories", async ({ page }) => {
    await page.goto("/parts");
    await expect(page.locator("h1")).toContainText("Parts");
  });
});
