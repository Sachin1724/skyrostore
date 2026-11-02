import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

/**
 * The visitor's IP. Most store calls arrive from the storefront's server, so
 * its own IP would put every customer in one bucket; the storefront forwards
 * the visitor IP with a shared secret, and only then is that header trusted.
 */
export function clientIp(req: { headers: Record<string, any>; ip?: string; socket?: { remoteAddress?: string } }) {
  const secret = process.env.STOREFRONT_PROXY_SECRET;
  const forwardedIp = req.headers["x-skyro-client-ip"];
  if (secret && forwardedIp && req.headers["x-skyro-proxy-key"] === secret) return String(forwardedIp);
  return req.ip || req.socket?.remoteAddress || "unknown";
}

/**
 * Fixed-window limit per IP, counted in Medusa's cache module (Redis when
 * REDIS_URL is set, so the limit holds across instances).
 *
 * ponytail: get-then-set is not atomic, so a burst can overshoot by a few
 * requests per window; switch to Redis INCR if that ever matters.
 */
export function rateLimit(name: string, limit: number, windowSeconds: number) {
  return async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    try {
      const cache = req.scope.resolve(Modules.CACHE) as any;
      const window = Math.floor(Date.now() / 1000 / windowSeconds);
      const key = `rl:${name}:${clientIp(req as any)}:${window}`;
      const count = Number((await cache.get(key)) || 0) + 1;
      await cache.set(key, count, windowSeconds);
      if (count > limit) {
        res.setHeader("Retry-After", String(windowSeconds));
        return res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
      }
    } catch {
      // A cache outage must not take sign-in or checkout down with it.
    }
    next();
  };
}
