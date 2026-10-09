import { defineMiddlewares, authenticate } from "@medusajs/framework/http";

export default defineMiddlewares({
  routes: [
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
