import type { MedusaRequest } from "@medusajs/framework/http";

/** Logged-in customer id, else the anonymous visitor id the storefront sends. */
export function getEffectiveCustomerId(req: MedusaRequest): string {
  const actorId = (req as unknown as { auth_context?: { actor_id?: string } }).auth_context?.actor_id;
  if (actorId) return actorId;
  const headerId = req.headers["x-visitor-id"] as string | undefined;
  // Anonymous ids only: a caller must not be able to claim a real customer's id (cus_...) or an admin's.
  if (headerId && /^[A-Za-z0-9_-]{8,64}$/.test(headerId) && !/^(cus|user)_/.test(headerId)) return headerId;
  return "guest_default";
}
