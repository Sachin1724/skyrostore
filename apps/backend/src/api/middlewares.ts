import { defineMiddlewares, authenticate } from "@medusajs/framework/http";
import { requireOrderOwner } from "./middlewares/require-order-owner";

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
