import type { NextRequest } from "next/server";

/**
 * Tells the backend which visitor a server-side call is for, so its per-IP
 * rate limits apply per customer rather than to this server as a whole. The
 * backend trusts the IP only alongside the shared STOREFRONT_PROXY_SECRET.
 * In production nginx must *set* X-Real-IP / X-Forwarded-For from
 * $remote_addr, never pass a client-supplied value through.
 */
export function visitorHeaders(request: NextRequest): Record<string, string> {
  const secret = process.env.STOREFRONT_PROXY_SECRET;
  if (!secret) return {};
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown";
  return { "x-skyro-client-ip": ip, "x-skyro-proxy-key": secret };
}
