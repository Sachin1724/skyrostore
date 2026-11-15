import { defineConfig } from "vitest/config";

// CI has no Medusa stack, so skip the suites that call a live backend (MEDUSA_URL).
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: [
      "tests/admin-specs.test.ts",
      "tests/bulk-orders.test.ts",
      "tests/commerce-loop.test.ts",
      "tests/configuration-integrity.test.ts",
      "tests/manufacturing.test.ts",
      "tests/order-snapshot.test.ts",
      "tests/payment-razorpay.test.ts",
      "tests/phase42-integration.test.ts",
    ],
    testTimeout: 30000,
  },
});
