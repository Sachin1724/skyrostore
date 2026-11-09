import type { MedusaRequest } from "@medusajs/framework/http";

/** Logged-in customer id, else the anonymous visitor id the storefront sends. */
export function getEffectiveCustomerId(req: MedusaRequest): string {
  const actorId = (req as unknown as { auth_context?: { actor_id?: string } }).auth_context?.actor_id;
  if (actorId) return actorId;
  const headerId = req.headers["x-visitor-id"] as string | undefined;
  return headerId || "guest_default";
}
