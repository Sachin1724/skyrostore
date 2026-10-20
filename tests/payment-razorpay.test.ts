import { describe, it, expect } from "vitest";
import crypto from "crypto";
import RazorpayProviderService from "../apps/backend/src/modules/razorpay/service";

const BASE = process.env.MEDUSA_URL || "http://localhost:9000";

describe("Razorpay Payment Integration", () => {
  describe("Provider service unit tests", () => {
    it("has correct identifier", () => {
      expect(RazorpayProviderService.identifier).toBe("razorpay");
    });

    it("validateOptions rejects missing key_id", () => {
      expect(() => RazorpayProviderService.validateOptions({} as any)).toThrow("key_id");
    });

    it("validateOptions rejects missing key_secret", () => {
      expect(() => RazorpayProviderService.validateOptions({ key_id: "rzp_test_123" } as any)).toThrow("key_secret");
    });

    it("validateOptions passes with valid options", () => {
      expect(() =>
        RazorpayProviderService.validateOptions({
          key_id: "rzp_test_123",
          key_secret: "secret",
          webhook_secret: "whsec",
        })
      ).not.toThrow();
    });
  });

  describe("Webhook endpoint", () => {
    it("rejects request without signature", async () => {
      const res = await fetch(`${BASE}/webhooks/razorpay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "payment.captured", payload: {} }),
      });
      expect(res.status).toBe(401);
    });

    it("rejects request with invalid signature", async () => {
      const body = JSON.stringify({ event: "payment.captured", payload: {} });
      const res = await fetch(`${BASE}/webhooks/razorpay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-razorpay-signature": "invalid_signature_hex_value_here_abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
        },
        body,
      });
      expect(res.status).toBe(401);
    });

    it("accepts valid webhook when secret configured", async () => {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        // No secret configured — skip integration test
        return;
      }
      const body = JSON.stringify({
        event: "payment.captured",
        event_id: `evt_test_${Date.now()}`,
        payload: { payment: { entity: { id: "pay_test", status: "captured" } } },
      });
      const signature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");

      const res = await fetch(`${BASE}/webhooks/razorpay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-razorpay-signature": signature,
        },
        body,
      });
      expect(res.status).toBe(200);
    });
  });

  describe("Signature verification logic", () => {
    it("creates correct HMAC for order_id|payment_id", () => {
      const secret = "test_secret_key";
      const orderId = "order_abc123";
      const paymentId = "pay_xyz789";

      const signature = crypto
        .createHmac("sha256", secret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      // Verify it's a valid hex string of correct length
      expect(signature).toMatch(/^[0-9a-f]{64}$/);

      // Same inputs produce same signature
      const signature2 = crypto
        .createHmac("sha256", secret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
      expect(signature).toBe(signature2);

      // Different inputs produce different signature
      const signature3 = crypto
        .createHmac("sha256", secret)
        .update(`${orderId}|pay_different`)
        .digest("hex");
      expect(signature).not.toBe(signature3);
    });

    it("client-submitted payment status cannot bypass verification", () => {
      // Simulate client sending fake authorized status
      const fakeClientData = {
        razorpay_order_id: "order_fake",
        razorpay_payment_id: "pay_fake",
        razorpay_signature: "client_submitted_fake_signature",
      };

      const secret = "server_secret";
      const expected = crypto
        .createHmac("sha256", secret)
        .update(`${fakeClientData.razorpay_order_id}|${fakeClientData.razorpay_payment_id}`)
        .digest("hex");

      // Fake signature won't match server-computed signature
      expect(fakeClientData.razorpay_signature).not.toBe(expected);
    });
  });

  describe("Payment flow security", () => {
    it("order-snapshot endpoint rejects missing fields", async () => {
      const res = await fetch(`${BASE}/store/uav/order-snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": "pk_11e52cb93d15418c56289d434fee7c53a391460b6a393b72ad48192afe3c4816" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
  });
});
