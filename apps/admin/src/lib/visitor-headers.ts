import type { NextRequest } from "next/server";

/**
 * Passes the real client IP to the backend so its login rate limit applies per
 * person, not to this server as a whole. The backend only trusts the IP
 * alongside STOREFRONT_PROXY_SECRET (the same value the storefront uses).
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
