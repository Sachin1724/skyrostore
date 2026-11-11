import { defineMiddlewares, authenticate } from "@medusajs/framework/http";
import { requireOrderOwner } from "./middlewares/require-order-owner";
import { rateLimit } from "./middlewares/rate-limit";
import { releaseCheckoutHold } from "../lib/inventory-hold";

/**
 * Medusa's own cart completion reserves stock for the order and checks availability, so this cart's
 * checkout hold must be handed back first or completion fails for the held units. The Razorpay path
 * does the same in lib/razorpay-checkout.ts.
 */
async function releaseHoldBeforeComplete(req: any, _res: any, next: any) {
  await releaseCheckoutHold(req.scope, req.params.id).catch(() => null);
  next();
}

function captureRawBody(req: any, _res: any, next: any) {
  const chunks: Buffer[] = [];
  req.on("data", (chunk: Buffer) => chunks.push(chunk));
  req.on("end", () => {
    req.rawBody = Buffer.concat(chunks);
    try {
      req.body = JSON.parse(req.rawBody.toString("utf-8"));
    } catch {
      req.body = {};
    }
    next();
  });
  req.on("error", next);
}

export default defineMiddlewares({
  routes: [
    // Abuse limits per IP. Sign-in is the brute-force target; the public
    // collectors and Razorpay callbacks are the flood targets.
    { matcher: "/auth/customer/*", method: ["POST"], middlewares: [rateLimit("auth-customer", 20, 300)] },
    { matcher: "/auth/user/*", method: ["POST"], middlewares: [rateLimit("auth-admin", 10, 300)] },
    { matcher: "/store/analytics/*", method: ["POST"], middlewares: [rateLimit("analytics", 120, 60)] },
    { matcher: "/store/razorpay/confirm", method: ["POST"], middlewares: [rateLimit("rzp-confirm", 20, 300)] },
    { matcher: "/razorpay/shipping-info", method: ["POST"], middlewares: [rateLimit("rzp-shipping", 120, 60)] },
    { matcher: "/store/bulk-orders", method: ["POST"], middlewares: [rateLimit("bulk-orders", 10, 3600)] },
    { matcher: "/store/delivery-check", method: ["GET"], middlewares: [rateLimit("delivery-check", 30, 60)] },
    { matcher: "/store/customers", method: ["POST"], middlewares: [rateLimit("customer-create", 10, 3600)] },
    // A stock hold per checkout attempt: a real shopper needs a few, a script locking stock needs many.
    { matcher: "/store/carts/:id/reserve", method: ["POST"], middlewares: [rateLimit("cart-reserve", 8, 900)] },
    { matcher: "/store/carts/:id/complete", method: ["POST"], middlewares: [releaseHoldBeforeComplete] },
    {
      matcher: "/webhooks/razorpay",
      method: ["POST"],
      bodyParser: false,
      middlewares: [captureRawBody],
    },
    {
      matcher: "/store/uav/configurations",
      method: ["POST"],
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    {
      matcher: "/store/uav/configurations",
      method: ["GET"],
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    {
      matcher: "/store/uav/configurations/:id",
      method: ["GET"],
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    {
      matcher: "/store/uav/configurations/:id/snapshot",
      method: ["POST", "GET"],
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    {
      // Medusa leaves order retrieval unauthenticated by design; this store
      // requires the order to belong to the signed-in customer.
      matcher: "/store/orders/:id",
      method: ["GET"],
      middlewares: [
        authenticate("customer", ["bearer", "session"]),
        requireOrderOwner,
      ],
    },
    {
      matcher: "/store/orders/:id/cancel",
      method: ["POST"],
      middlewares: [
        authenticate("customer", ["bearer", "session"]),
        requireOrderOwner,
      ],
    },
    {
      // A registration token has no customer yet, so unregistered identities
      // must be allowed through to read their own pending profile.
      matcher: "/store/auth/pending-profile",
      method: ["GET"],
      middlewares: [
        authenticate("customer", ["bearer"], { allowUnregistered: true }),
      ],
    },
    {
      // Optional auth: a signed-in customer's events get attributed to them,
      // an anonymous visitor's are still collected.
      matcher: "/store/analytics/events",
      method: ["POST"],
      middlewares: [authenticate("customer", ["bearer", "session"], { allowUnauthenticated: true })],
    },
    {
      matcher: "/store/bulk-orders",
      method: ["POST"],
      middlewares: [authenticate("customer", ["bearer", "session"], { allowUnauthenticated: true })],
    },
    {
      matcher: "/store/bulk-orders",
      method: ["GET"],
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    {
      matcher: "/store/bulk-orders/:id",
      method: ["GET"],
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    {
      matcher: "/store/bulk-orders/:id/accept",
      method: ["POST"],
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    {
      matcher: "/store/bulk-orders/:id/decline",
      method: ["POST"],
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
  ],
});
